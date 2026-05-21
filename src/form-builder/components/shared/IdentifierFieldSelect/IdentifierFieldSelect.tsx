'use client'

import type { TextFieldClientProps } from 'payload'

import { SelectInput, useField, useFormFields } from '@payloadcms/ui'
import * as React from 'react'

const EXCLUDED_TYPES = new Set(['array', 'file', 'group', 'message'])

type FormPage = {
  rows?: Array<{
    columns?: Array<{
      label?: string
      name?: string
      type?: string
    }>
  }>
}

export function IdentifierFieldSelect({ path }: TextFieldClientProps) {
  const { setValue, value = '' } = useField<string>({
    path: path ?? 'identifierField',
  })
  const pages = useFormFields(([fields]) => fields.pages) as { value?: FormPage[] } | undefined

  const options = React.useMemo(() => {
    if (!pages?.value?.length) {
      return []
    }
    return pages.value
      .flatMap((page) => page.rows?.flatMap((row) => row.columns ?? []) ?? [])
      .filter(
        (field): field is { label: string; name: string; type: string } =>
          !!field && !EXCLUDED_TYPES.has(field.type ?? '') && !!field.name,
      )
      .map((field) => ({
        label: field.label || field.name,
        value: field.name,
      }))
  }, [pages?.value])

  return (
    <SelectInput
      isClearable
      label="Identifier Field"
      name={path ?? 'identifierField'}
      onChange={(option) => {
        setValue(option ? (option as { value: string }).value : '')
      }}
      options={options}
      path={path ?? 'identifierField'}
      placeholder="Select identifier field…"
      value={value}
    />
  )
}
