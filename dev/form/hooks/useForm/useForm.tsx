import ArrayField from '../../fields/ArrayField'
import CheckboxField from '../../fields/CheckboxField'
import ConsentField from '../../fields/ConsentField'
import DateField from '../../fields/DateField'
import FileField from '../../fields/FileField'
import RadioField from '../../fields/RadioField'
import SelectField from '../../fields/SelectField'
import TextareaField from '../../fields/TextareaField'
import TextField from '../../fields/TextField'
import ToggleField from '../../fields/ToggleField'
import { buildValidatorCache, getDefaultValues, isVisible } from '../../utils'
import { createFormHook, formOptions, useStore } from '@tanstack/react-form'
import * as React from 'react'
import type { Form as TFormProps } from '../../../payload-types'

import { fieldContext, formContext, useFormContext } from '../useFormContext'
import { useFormPagination } from '../useFormPagination'

import type { FormFieldValue, NamedFieldProps } from '@spon/payload-forms/form'
import type { FormField } from '@forms/types'

type FormValues = Record<string, FormFieldValue>

/**
 * Shared form options — anchors TFormData = FormValues for type inference.
 * Pass to useAppForm (spread + override defaultValues) and useTypedAppFormContext.
 */
export const formOpts = formOptions({
	defaultValues: {} as FormValues,
})

function SubscribeButton({
	children,
	...props
}: React.ComponentProps<'button'>) {
	const form = useFormContext()
	return (
		<form.Subscribe selector={(state) => state.isSubmitting}>
			{(isSubmitting) => (
				<button {...props} type="submit" disabled={isSubmitting}>
					{children}
				</button>
			)}
		</form.Subscribe>
	)
}

export const { useAppForm, withForm, withFieldGroup, useTypedAppFormContext } =
	createFormHook({
		fieldComponents: {
			ArrayField,
			CheckboxField,
			ConsentField,
			DateField,
			FileField,
			RadioField,
			SelectField,
			TextareaField,
			TextField,
			ToggleField,
		},
		formComponents: {
			SubscribeButton,
		},
		fieldContext,
		formContext,
	})

export function useDefaultValues(pages: TFormProps['pages']): FormValues {
	const defaultValues: FormValues = React.useMemo(
		() => getDefaultValues(pages),
		// pages is derived from stable prop data — only compute once
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[],
	)
	return defaultValues
}

export function useValidator(formSchema: TFormProps['formSchema']) {
	const validatorCache = React.useMemo(
		() => buildValidatorCache(formSchema),
		// formSchema is stable for the lifetime of the form — only compute once
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[],
	)

	return validatorCache
}

export function useForm({
	onSubmit,
	pages: inputPages,
	formSchema,
	defaultValues: overrideValues,
}: {
	onSubmit?: (values: FormValues, { _hp }: { _hp?: string }) => Promise<void>
	pages?: TFormProps['pages']
	formSchema?: TFormProps['formSchema']
	defaultValues?: FormValues
}) {
	const pages = inputPages ?? []

	const honeypotRef = React.useRef<HTMLInputElement>(null)
	const { currentPage, next, prev } = useFormPagination()

	const schemaDefaults = useDefaultValues(pages)
	const validatorCache = useValidator(formSchema)

	// Merge schema defaults with override values — override takes priority.
	// Both are stable for the lifetime of the form, so compute once.
	const defaultValues = React.useMemo(
		() =>
			overrideValues ? { ...schemaDefaults, ...overrideValues } : schemaDefaults,
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[],
	)

	const form = useAppForm({
		...formOpts,
		defaultValues,
		onSubmit: async ({ value }) => {
			await onSubmit?.(value, { _hp: honeypotRef.current?.value })
		},
	})

	const values = useStore(form.store, (s) => s.values)
	const page = pages[currentPage]

	const isFirstPage = currentPage === 0
	const isLastPage = currentPage === pages.length - 1

	const visiblePageFields =
		page?.rows
			.flatMap((row) => row.columns as unknown as FormField[])
			.filter(
				(f): f is NamedFieldProps =>
					f.type !== 'message' && isVisible(f, values),
			) ?? []

	async function handleNext() {
		await Promise.all(
			visiblePageFields.map((f) => form.validateField(f.name, 'blur')),
		)
		const hasErrors = visiblePageFields.some((f) => {
			const meta = form.getFieldMeta(f.name)
			return meta?.errors && meta.errors.length > 0
		})
		if (!hasErrors) {
			next()
		}
	}

	return {
		form,
		page,
		values,
		validatorCache,
		pagination: {
			isFirstPage,
			isLastPage,
			currentPage,
			handleNext,
			handlePrev: prev,
		},
		honeypotRef,
	}
}
