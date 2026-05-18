'use client'

import { useForm } from '@forms/hooks/useForm'
import type { FormValues } from '@forms/types'
import { createFormBody } from '@forms/api'
import * as React from 'react'
import type { Form as TFormProps } from '../../../payload-types'
import { FieldRenderer } from './FieldRenderer'

interface FormProps {
	data: Pick<TFormProps, 'id' | 'pages' | 'formSchema'> & { submitButtonLabel?: string | null }
	onSubmit?: (values: FormValues, { _hp }: { _hp?: string }) => Promise<void>
	defaultValues?: FormValues
	className?: string
	showHidden?: boolean
}

export function Form({ data, onSubmit, defaultValues, className, showHidden }: FormProps) {
	const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''

	const handleSubmit = React.useCallback(
		async (values: FormValues, { _hp }: { _hp?: string }) => {
			if (onSubmit) {
				return onSubmit(values, { _hp })
			}
			const formData = createFormBody({
				value: values as Record<string, unknown>,
				id: String(data.id),
				_hp: _hp ?? '',
				_ts: String(Date.now()),
			})
			await fetch(`${baseUrl}/api/submit`, {
				method: 'POST',
				body: formData,
			})
		},
		[onSubmit, data.id, baseUrl],
	)

	const {
		form,
		page,
		values,
		validatorCache,
		pagination: { isFirstPage, isLastPage, handleNext, handlePrev },
		honeypotRef,
	} = useForm({
		onSubmit: handleSubmit,
		pages: data.pages,
		formSchema: data.formSchema,
		defaultValues,
	})

	if (!page) {return null}

	return (
		<form.AppForm>
			<form
				onSubmit={(e) => {
					e.preventDefault()
					e.stopPropagation()
					void form.handleSubmit()
				}}
				className={className}
			>
				<input
					ref={honeypotRef}
					type="text"
					name="pageId"
					autoComplete="off"
					tabIndex={-1}
					aria-hidden="true"
					style={{
						position: 'absolute',
						left: '-9999px',
						opacity: 0,
						pointerEvents: 'none',
					}}
				/>
				<div>
					{page.rows.map((row) => (
						<div key={row.id}>
							{row.columns.map((field) => (
								<FieldRenderer
									key={field.id}
									field={field}
									values={values}
									validatorCache={validatorCache}
									showHidden={showHidden}
								/>
							))}
						</div>
					))}
				</div>

				<div>
					{!isFirstPage && (
						<button type="button" onClick={() => handlePrev()}>
							{page.backButton ?? 'Back'}
						</button>
					)}

					{isLastPage ? (
						<form.SubscribeButton>
							{data.submitButtonLabel ?? 'Submit'}
						</form.SubscribeButton>
					) : (
						<button type="button" onClick={() => void handleNext()}>
							{page.nextButton ?? 'Next'}
						</button>
					)}
				</div>
			</form>
		</form.AppForm>
	)
}
