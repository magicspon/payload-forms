'use client'

import type { ZodType } from 'zod'

import * as React from 'react'

import type { AllFields } from '../../../fieldSchema'

// ── Public types ──────────────────────────────────────────────────────────────

export type FieldMeta = { errors: string[]; isTouched: boolean }

 
export type AnyFieldApi = {
  handleChange: (value: unknown) => void
  state: { meta: FieldMeta; value: unknown }
}

type TypedFieldApi<T, K extends keyof T> = {
  handleChange: (value: T[K]) => void
  state: { meta: FieldMeta; value: T[K] }
}

type FormSnapshot<T> = {
  canSubmit: boolean
  isSubmitting: boolean
  values: T
}

// ── Internal context ──────────────────────────────────────────────────────────

type EditorFormCtxValue = {
  canSubmit: boolean
  fieldErrors: Record<string, string[]>
  handleSubmit: () => Promise<void>
  isSubmitting: boolean
  setField: (name: string, value: unknown) => void
  touched: Record<string, boolean>
  values: Record<string, unknown>
}

export const EditorFormContext = React.createContext<EditorFormCtxValue | null>(null)
/** @deprecated use EditorFormContext */
export const EditorFormCtx = EditorFormContext

function useEditorFormCtx() {
  const ctx = React.use(EditorFormCtx)
  if (!ctx) {throw new Error('Must be used inside an EditorFormCtxProvider')}
  return ctx
}

// ── Stable module-level Field component ───────────────────────────────────────
// Defined outside any hook so the component identity is stable across renders.

function FieldImpl<T extends object, K extends keyof T>({
  name,
  children,
}: {
  children: (field: TypedFieldApi<T, K>) => React.ReactNode
  name: K
}) {
  const ctx = useEditorFormCtx()
  const key = name as string
  const api: TypedFieldApi<T, K> = {
    handleChange: (value) => ctx.setField(key, value),
    state: {
      meta: {
        errors: ctx.fieldErrors[key] ?? [],
        isTouched: ctx.touched[key] ?? false,
      },
      value: ctx.values[key] as T[K],
    },
  }
  return <>{children(api)}</>
}

// ── Stable module-level Subscribe component ───────────────────────────────────

function SubscribeImpl<T extends object, R>({
  children,
  selector,
}: {
  children: (value: R) => React.ReactNode
  selector: (state: FormSnapshot<T>) => R
}) {
  const ctx = useEditorFormCtx()
  const snapshot: FormSnapshot<T> = {
    canSubmit: ctx.canSubmit,
    isSubmitting: ctx.isSubmitting,
    values: ctx.values as T,
  }
  return <>{children(selector(snapshot))}</>
}

// ── Form API type ─────────────────────────────────────────────────────────────

export type EditorFormInstance<T extends object = AllFields> = {
  Field: <K extends keyof T>(props: {
    children: (field: TypedFieldApi<T, K>) => React.ReactNode
    name: K
  }) => React.ReactNode
  handleSubmit: () => Promise<void>
  Subscribe: <R>(props: {
    children: (value: R) => React.ReactNode
    selector: (state: FormSnapshot<T>) => R
  }) => React.ReactNode
  values: T
}

// ── Provider export ───────────────────────────────────────────────────────────

export const EditorFormCtxProvider = EditorFormCtx.Provider

// ── useFormContext ────────────────────────────────────────────────────────────

export function useFormContext<T extends AllFields = AllFields>(): EditorFormInstance<T> {
  const ctx = useEditorFormCtx()
  return {
    Field: FieldImpl as EditorFormInstance<T>['Field'],
    handleSubmit: ctx.handleSubmit,
    Subscribe: SubscribeImpl as EditorFormInstance<T>['Subscribe'],
    values: ctx.values as T,
  }
}

// ── useEditorForm hook ────────────────────────────────────────────────────────

export function useEditorForm<T extends object>({
  defaultValues,
  onSubmit,
  schema,
}: {
  defaultValues: T
  onSubmit: (values: T) => Promise<void>
  schema?: ZodType<T>
}): { contextValue: EditorFormCtxValue; form: EditorFormInstance<T> } {
  const [values, setValues] = React.useState<T>(defaultValues)
  const [touched, setTouched] = React.useState<Record<string, boolean>>({})
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  const fieldErrors = React.useMemo(() => {
    if (!schema) {return {} as Record<string, string[]>}
    const result = schema.safeParse(values)
    if (result.success) {return {} as Record<string, string[]>}
    const errs: Record<string, string[]> = {}
    for (const issue of result.error.issues) {
      const key = String(issue.path[0] ?? '')
      if (!key) {continue
      ;}(errs[key] ??= []).push(issue.message)
    }
    return errs
  }, [values, schema])

  const canSubmit = !isSubmitting && Object.keys(fieldErrors).length === 0

  const setField = React.useCallback((name: string, value: unknown) => {
    setValues((prev) => ({ ...prev, [name]: value }))
    setTouched((prev) => ({ ...prev, [name]: true }))
  }, [])

  // Keep latest values/onSubmit in a ref so handleSubmit never goes stale
  const latestRef = React.useRef({ onSubmit, values })
  latestRef.current = { onSubmit, values }

  const handleSubmit = React.useCallback(async () => {
    setIsSubmitting(true)
    try {
      await latestRef.current.onSubmit(latestRef.current.values)
    } finally {
      setIsSubmitting(false)
    }
  }, [])

  const contextValue: EditorFormCtxValue = {
    canSubmit,
    fieldErrors,
    handleSubmit,
    isSubmitting,
    setField,
    touched,
    values: values as Record<string, unknown>,
  }

  const form: EditorFormInstance<T> = {
    Field: FieldImpl as EditorFormInstance<T>['Field'],
    handleSubmit,
    Subscribe: SubscribeImpl as EditorFormInstance<T>['Subscribe'],
    values,
  }

  return { contextValue, form }
}

// ── EditorSettings context ────────────────────────────────────────────────────

type EditorSettingsContextValue = {
  currentFieldId: string
  existingFieldNames: Set<string>
}

const EditorSettingsContext = React.createContext<EditorSettingsContextValue | null>(null)

export function EditorSettingsProvider({
  children,
  currentFieldId,
  existingFieldNames,
}: { children: React.ReactNode } & EditorSettingsContextValue) {
  const value = React.useMemo(
    () => ({ currentFieldId, existingFieldNames }),
    [existingFieldNames, currentFieldId],
  )
  return (
    <EditorSettingsContext value={value}>
      {children}
    </EditorSettingsContext>
  )
}

export function useEditorSettings() {
  const context = React.use(EditorSettingsContext)
  if (!context) {
    throw new Error('useEditorSettings must be used within an EditorSettingsProvider')
  }
  return context
}
