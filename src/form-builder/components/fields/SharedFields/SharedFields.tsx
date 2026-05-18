import type { ChangeEvent } from 'react'

import { type AnyFieldApi } from '@/shared/context/EditorFormContext'
import {
	useEditorSettings,
	useFormContext,
} from '@/shared/context/EditorFormContext'
import { camelCase } from '@/shared/utils/camelCase'
import { CheckboxInput, TextInput, useField } from '@payloadcms/ui'

import { ConditionEditor } from '../ConditionEditor'
import styles from './SharedFields.module.css'

type FieldProps = {
	field: AnyFieldApi
}

type ConditionsFieldProps = {
	currentFieldId: string
} & FieldProps

export function NameField({ field }: FieldProps) {
	const { existingFieldNames } = useEditorSettings()
	const value = (field.state.value as string) ?? ''
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const form = useFormContext<any>()
	const { value: locked } = useField<boolean>({ path: 'locked' })

	return (
		<form.Subscribe
			selector={(state) => 'label' in state.values && state.values.label}
		>
			{(state) => {
				const fromLabel = typeof state === 'string' ? camelCase(state) : ''
				const effectiveValue = value.length > 0 ? value : fromLabel
				const isDuplicate =
					!!effectiveValue && existingFieldNames.has(effectiveValue)
				const hasError =
					(field.state.meta.isTouched && field.state.meta.errors.length > 0) ||
					isDuplicate

				return (
					<div>
						<TextInput
							description={
								'Field name is locked — edit in the default locale only'
							}
							label="Name"
							onChange={(e: ChangeEvent<HTMLInputElement>) =>
								field.handleChange(e.target.value)
							}
							path="name"
							readOnly={locked}
							required
							showError={hasError}
							value={effectiveValue}
						/>
						{isDuplicate && (
							<p className="field-error mt-1">
								A field with the name "{effectiveValue}" already exists
							</p>
						)}
					</div>
				)
			}}
		</form.Subscribe>
	)
}

export function LabelField({ field }: FieldProps) {
	const { value: locked } = useField<boolean>({ path: 'locked' })

	return (
		<TextInput
			description="The label displayed to users"
			label="Label"
			onChange={(e: ChangeEvent<HTMLInputElement>) =>
				field.handleChange(e.target.value)
			}
			path="label"
			readOnly={locked}
			required
			showError={
				field.state.meta.isTouched && field.state.meta.errors.length > 0
			}
			value={(field.state.value as string) ?? ''}
		/>
	)
}

export function RequiredField({ field }: FieldProps) {
	return (
		<CheckboxInput
			checked={field.state.value as boolean}
			label="Required"
			onToggle={(e) => field.handleChange(e.target.checked)}
		/>
	)
}

export function VisibilityField({ field }: FieldProps) {
	return (
		<div className={styles.visibilityGrid}>
			<CheckboxInput
				checked={!!field.state.value}
				label="Hidden"
				onToggle={(e) => field.handleChange(e.target.checked)}
			/>
			<p className="field-description field-description-errorMessage">
				Hidden fields are not shown to the user but are included in form
				submissions.
			</p>
		</div>
	)
}

export function ErrorMessageField({ field }: FieldProps) {
	return (
		<TextInput
			description="Custom error message when validation fails"
			label="Error Message"
			onChange={(e: ChangeEvent<HTMLInputElement>) =>
				field.handleChange(e.target.value)
			}
			path="errorMessage"
			value={(field.state.value as string) ?? ''}
		/>
	)
}

export function InstructionsField({ field }: FieldProps) {
	return (
		<TextInput
			description="Help text displayed below the field"
			label="Instructions"
			onChange={(e: ChangeEvent<HTMLInputElement>) =>
				field.handleChange(e.target.value)
			}
			path="instructions"
			value={(field.state.value as string) ?? ''}
		/>
	)
}

export function PlaceholderField({ field }: FieldProps) {
	return (
		<TextInput
			description="Text displayed in the input field before the user enters a value"
			label="Placeholder"
			onChange={(e: ChangeEvent<HTMLInputElement>) =>
				field.handleChange(e.target.value)
			}
			path="placeholder"
			value={(field.state.value as string) ?? ''}
		/>
	)
}

export function DefaultValueField({ field }: FieldProps) {
	return (
		<TextInput
			description="The value that is set in the input field by default"
			label="Default Value"
			onChange={(e: ChangeEvent<HTMLInputElement>) =>
				field.handleChange(e.target.value)
			}
			path="defaultValue"
			value={(field.state.value as string) ?? ''}
		/>
	)
}

export function ConditionsField({
	currentFieldId,
	field,
}: ConditionsFieldProps) {
	return <ConditionEditor currentFieldId={currentFieldId} field={field} />
}

export function AdvancedFields({
	children,
	exclude,
}: {
	children?: React.ReactNode
	exclude?: string[]
}) {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const form = useFormContext<any>()

	return (
		<div className={styles.grid}>
			<form.Field name="name">{(f) => <NameField field={f} />}</form.Field>

			{!exclude?.includes('hidden') && (
				<form.Field name="hidden">
					{(f) => <VisibilityField field={f} />}
				</form.Field>
			)}

			{!exclude?.includes('errorMessage') && (
				<form.Field name="errorMessage">
					{(f) => <ErrorMessageField field={f} />}
				</form.Field>
			)}

			{!exclude?.includes('instructions') && (
				<form.Field name="instructions">
					{(f) => <InstructionsField field={f} />}
				</form.Field>
			)}

			{!exclude?.includes('placeholder') && (
				<form.Field name="placeholder">
					{(f) => <PlaceholderField field={f} />}
				</form.Field>
			)}
			{!exclude?.includes('defaultValue') && (
				<form.Field name="defaultValue">
					{(f) => <DefaultValueField field={f} />}
				</form.Field>
			)}
			{children}
		</div>
	)
}

export function GeneralFields({
	children,
	exclude: _exclude,
}: {
	children?: React.ReactNode
	exclude?: string[]
}) {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const form = useFormContext<any>()

	return (
		<div className={styles.grid}>
			<form.Field name="label">{(f) => <LabelField field={f} />}</form.Field>
			<form.Field name="required">
				{(f) => <RequiredField field={f} />}
			</form.Field>
			{children}
		</div>
	)
}


export function Divider() {
	return <hr className={styles.divider} />
}
