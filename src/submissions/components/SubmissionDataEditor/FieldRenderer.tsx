'use client'

import type {
	ArrayField,
	ArrayItemField,
	CheckboxField,
	ConsentField,
	DateField,
	EmailField,
	Field,
	FileField,
	MessageField,
	NumberField,
	RadioField,
	SelectField,
	TextareaField,
	TextField,
	ToggleField,
} from '@/shared/fieldSchema'
import type React from 'react'

import { nanoid } from '@/shared/utils/nanoid'
import {
	CheckboxInput,
	DatePicker,
	SelectInput,
	TextareaInput,
	TextInput,
	UploadInput,
} from '@payloadcms/ui'
import { useCallback, useMemo, useRef, useState } from 'react'

type NonMessageField = Exclude<Field, MessageField>

export type FieldRendererProps = {
	field: NonMessageField
	formUploadsSlug: string
	onChange: (value: unknown) => void
	value: unknown
}

export function FieldRenderer({
	field,
	formUploadsSlug,
	onChange,
	value,
}: FieldRendererProps) {
	switch (field.type) {
		case 'array':
			return (
				<ArrayFieldRenderer
					field={field}
					formUploadsSlug={formUploadsSlug}
					onChange={onChange}
					value={value as Record<string, unknown>[] | undefined}
				/>
			)
		case 'checkbox':
			return (
				<CheckboxGroupRenderer
					field={field}
					onChange={onChange}
					value={value as string[] | undefined}
				/>
			)
		case 'consent':
		case 'toggle':
			return (
				<ToggleFieldRenderer
					field={field}
					onChange={onChange}
					value={value as boolean | undefined}
				/>
			)
		case 'date':
			return (
				<DateFieldRenderer
					field={field}
					onChange={onChange}
					value={value as string | undefined}
				/>
			)
		case 'email':
		case 'text':
			return (
				<TextFieldRenderer
					field={field}
					onChange={onChange}
					value={value as string | undefined}
				/>
			)
		case 'file':
			return (
				<FileFieldRenderer
					field={field}
					formUploadsSlug={formUploadsSlug}
					onChange={onChange}
					value={value}
				/>
			)
		case 'number':
			return (
				<NumberFieldRenderer
					field={field}
					onChange={onChange}
					value={value as number | undefined}
				/>
			)
		case 'radio':
			return (
				<RadioFieldRenderer
					field={field}
					onChange={onChange}
					value={value as string | undefined}
				/>
			)
		case 'select':
			return (
				<SelectFieldRenderer
					field={field}
					onChange={onChange}
					value={value as string | undefined}
				/>
			)
		case 'textarea':
			return (
				<TextareaFieldRenderer
					field={field}
					onChange={onChange}
					value={value as string | undefined}
				/>
			)
		default:
			return null
	}
}

// ─── Text / Email ─────────────────────────────────────────────────────────────

function TextFieldRenderer({
	field,
	onChange,
	value,
}: {
	field: EmailField | TextField
	onChange: (v: unknown) => void
	value: string | undefined
}) {
	return (
		<TextInput
			hasMany={false}
			label={field.label}
			onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
				onChange(e.target.value)
			}
			path={field.name}
			required={field.required}
			value={value ?? ''}
		/>
	)
}

// ─── Textarea ─────────────────────────────────────────────────────────────────

function TextareaFieldRenderer({
	field,
	onChange,
	value,
}: {
	field: TextareaField
	onChange: (v: unknown) => void
	value: string | undefined
}) {
	return (
		<TextareaInput
			label={field.label}
			onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
				onChange(e.target.value)
			}
			path={field.name}
			required={field.required}
			rows={field.rows}
			value={value ?? ''}
		/>
	)
}

// ─── Number ───────────────────────────────────────────────────────────────────

function NumberFieldRenderer({
	field,
	onChange,
	value,
}: {
	field: NumberField
	onChange: (v: unknown) => void
	value: number | undefined
}) {
	return (
		<div className="field-type number">
			<div className="label-wrapper">
				<label className="field-label" htmlFor={`field-${field.name}`}>
					{field.label}
					{field.required && <span className="required">*</span>}
				</label>
			</div>
			<input
				className="field-base"
				id={`field-${field.name}`}
				max={field.max}
				min={field.min}
				onChange={(e) => onChange(e.target.valueAsNumber)}
				placeholder={field.placeholder}
				step={field.step}
				type="number"
				value={value ?? ''}
			/>
		</div>
	)
}

// ─── Date ─────────────────────────────────────────────────────────────────────

function DateFieldRenderer({
	field,
	onChange,
	value,
}: {
	field: DateField
	onChange: (v: unknown) => void
	value: string | undefined
}) {
	const dateValue = value ? new Date(value) : undefined
	return (
		<div className="field-type date">
			<div className="label-wrapper">
				<label className="field-label">
					{field.label}
					{field.required && <span className="required">*</span>}
				</label>
			</div>
			<DatePicker
				onChange={(val: Date | undefined) =>
					onChange(val ? val.toISOString() : null)
				}
				placeholder={field.placeholder}
				value={dateValue}
			/>
		</div>
	)
}

// ─── Select ───────────────────────────────────────────────────────────────────

function SelectFieldRenderer({
	field,
	onChange,
	value,
}: {
	field: SelectField
	onChange: (v: unknown) => void
	value: string | undefined
}) {
	const options = useMemo(
		() => field.options.map((o) => ({ label: o.label, value: o.value })),
		[field.options],
	)

	return (
		<SelectInput
			label={field.label}
			name={field.name}
			onChange={(selected: unknown) => {
				if (selected && typeof selected === 'object' && 'value' in selected) {
					onChange((selected as { value: string }).value)
				} else {
					onChange(selected ?? null)
				}
			}}
			options={options}
			path={field.name}
			required={field.required}
			value={value ?? ''}
		/>
	)
}

// ─── Radio ────────────────────────────────────────────────────────────────────

function RadioFieldRenderer({
	field,
	onChange,
	value,
}: {
	field: RadioField
	onChange: (v: unknown) => void
	value: string | undefined
}) {
	const groupName = useRef(`radio-${field.name}-${nanoid()}`)
	return (
		<div className="field-type radio-group">
			<div className="label-wrapper">
				<label className="field-label">
					{field.label}
					{field.required && <span className="required">*</span>}
				</label>
			</div>
			<ul className="radio-group__list">
				{field.options.map((option) => (
					<li className="radio-group__list-item" key={option.value}>
						<input
							checked={value === option.value}
							id={`${field.name}-${option.value}`}
							name={groupName.current}
							onChange={() => onChange(option.value)}
							type="radio"
							value={option.value}
						/>
						<label htmlFor={`${field.name}-${option.value}`}>
							{option.label}
						</label>
					</li>
				))}
			</ul>
		</div>
	)
}

// ─── Checkbox group ───────────────────────────────────────────────────────────

function CheckboxGroupRenderer({
	field,
	onChange,
	value,
}: {
	field: CheckboxField
	onChange: (v: unknown) => void
	value: string[] | undefined
}) {
	const selected = useMemo(() => value ?? [], [value])

	const toggle = useCallback(
		(optValue: string) => {
			const next = selected.includes(optValue)
				? selected.filter((v) => v !== optValue)
				: [...selected, optValue]
			onChange(next)
		},
		[selected, onChange],
	)

	return (
		<div className="field-type checkbox-group">
			<div className="label-wrapper">
				<label className="field-label">
					{field.label}
					{field.required && <span className="required">*</span>}
				</label>
			</div>
			<ul className="checkbox-group__list">
				{field.options.map((option) => (
					<li key={option.value}>
						<CheckboxInput
							checked={selected.includes(option.value)}
							id={`${field.name}-${option.value}`}
							label={option.label}
							name={`${field.name}-${option.value}`}
							onToggle={() => toggle(option.value)}
						/>
					</li>
				))}
			</ul>
		</div>
	)
}

// ─── Toggle / Consent ─────────────────────────────────────────────────────────

function ToggleFieldRenderer({
	field,
	onChange,
	value,
}: {
	field: ConsentField | ToggleField
	onChange: (v: unknown) => void
	value: boolean | undefined
}) {
	return (
		<CheckboxInput
			checked={value ?? false}
			id={`field-${field.name}`}
			label={field.label}
			name={field.name}
			onToggle={(e) => onChange(e.target.checked)}
		/>
	)
}

// ─── File ─────────────────────────────────────────────────────────────────────

function FileFieldRenderer({
	field,
	formUploadsSlug,
	onChange,
	value,
}: {
	field: FileField
	formUploadsSlug: string
	onChange: (v: unknown) => void
	value: unknown
}) {
	// submissionData stores file as { id, url, name } or array of same
	const uploadValue = useMemo(() => {
		if (!value) {return undefined}
		if (Array.isArray(value)) {
			return value.map((f: { id?: string }) => f.id).filter(Boolean) as string[]
		}
		const f = value as { id?: string }
		return f.id ?? undefined
	}, [value])

	return (
		<UploadInput
			hasMany={field.multiple ?? false}
			label={field.label}
			onChange={(selected) => onChange(selected)}
			path={field.name}
			relationTo={
				formUploadsSlug as Parameters<typeof UploadInput>[0]['relationTo']
			}
			required={field.required}
			value={uploadValue}
		/>
	)
}

// ─── Array ────────────────────────────────────────────────────────────────────

function ArrayFieldRenderer({
	field,
	formUploadsSlug,
	onChange,
	value,
}: {
	field: ArrayField
	formUploadsSlug: string
	onChange: (v: unknown) => void
	value: Record<string, unknown>[] | undefined
}) {
	const subFields: ArrayItemField[] = field.rows.flatMap((row) => row.columns)
	const rows = useMemo(() => value ?? [], [value])

	const addRow = useCallback(() => {
		const empty: Record<string, unknown> = {}
		for (const f of subFields) {empty[f.name] = undefined}
		onChange([...rows, empty])
	}, [rows, subFields, onChange])

	const removeRow = useCallback(
		(index: number) => {
			onChange(rows.filter((_, i) => i !== index))
		},
		[rows, onChange],
	)

	const updateRow = useCallback(
		(index: number, fieldName: string, fieldValue: unknown) => {
			const next = rows.map((row, i) =>
				i === index ? { ...row, [fieldName]: fieldValue } : row,
			)
			onChange(next)
		},
		[rows, onChange],
	)

	const [ids] = useState<string[]>(() => rows.map(() => nanoid()))

	return (
		<div className="field-type array">
			<div className="label-wrapper">
				<label className="field-label">
					{field.label}
					{field.required && <span className="required">*</span>}
				</label>
			</div>
			<div className="array__rows">
				{rows.map((row, index) => (
					<div className="array__row" key={ids[index] ?? index}>
						<div className="array__row-fields">
							{subFields.map((subField) => (
								<FieldRenderer
									field={subField}
									formUploadsSlug={formUploadsSlug}
									key={subField.id}
									onChange={(v) => updateRow(index, subField.name, v)}
									value={row[subField.name]}
								/>
							))}
						</div>
						<button
							className="array__row-remove btn btn--style-secondary"
							onClick={() => removeRow(index)}
							type="button"
						>
							Remove
						</button>
					</div>
				))}
			</div>
			<button
				className="array__add-row btn btn--icon-style-without-border btn--style-secondary"
				disabled={field.maxRows !== undefined && rows.length >= field.maxRows}
				onClick={addRow}
				type="button"
			>
				Add row
			</button>
		</div>
	)
}
