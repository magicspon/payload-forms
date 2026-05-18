import type { ChangeEvent } from 'react'

import { Inline, Stack  } from '@/shared/ui/layout'
import { Button, CheckboxInput, DatePicker, SelectInput  } from '@payloadcms/ui'
import * as React from 'react'

import type { ArrayItemField } from '../../../fieldSchema'

import { OptionsEditor } from '../OptionsEditor'
import styles from './SubEditorForm.module.css'

type SubFieldInputsProps = {
	onChange: (updated: ArrayItemField) => void
	set: (patch: Partial<ArrayItemField>) => void
	subField: ArrayItemField
}

function GeneralInputs({ onChange, set, subField }: SubFieldInputsProps) {
	const hasOptions =
		subField.type === 'checkbox' ||
		subField.type === 'radio' ||
		subField.type === 'select'

	const hasPlaceholder =
		subField.type === 'text' ||
		subField.type === 'textarea' ||
		subField.type === 'email' ||
		subField.type === 'number' ||
		subField.type === 'date' ||
		subField.type === 'select'

	return (
		<>
			<div className={styles.twoColGrid}>
				<div className="field-type text">
					<label className="field-label" htmlFor={`sf-name-${subField.id}`}>
						Name <span aria-hidden="true">*</span>
					</label>
					<input
						className="field-type__input"
						id={`sf-name-${subField.id}`}
						onChange={(e: ChangeEvent<HTMLInputElement>) =>
							set({ name: e.target.value } as Partial<ArrayItemField>)
						}
						placeholder="field_name"
						type="text"
						value={'name' in subField ? (subField.name ?? '') : ''}
					/>
				</div>
				<div className="field-type text">
					<label className="field-label" htmlFor={`sf-label-${subField.id}`}>
						Label <span aria-hidden="true">*</span>
					</label>
					<input
						className="field-type__input"
						id={`sf-label-${subField.id}`}
						onChange={(e: ChangeEvent<HTMLInputElement>) =>
							set({ label: e.target.value } as Partial<ArrayItemField>)
						}
						placeholder="Field Label"
						type="text"
						value={'label' in subField ? (subField.label ?? '') : ''}
					/>
				</div>
			</div>

			{'required' in subField && (
				<CheckboxInput
					checked={subField.required}
					label="Required"
					onToggle={(e) =>
						set({ required: e.target.checked } as Partial<ArrayItemField>)
					}
				/>
			)}

			{hasPlaceholder && 'placeholder' in subField && (
				<div className="field-type text">
					<label
						className="field-label"
						htmlFor={`sf-placeholder-${subField.id}`}
					>
						Placeholder
					</label>
					<input
						className="field-type__input"
						id={`sf-placeholder-${subField.id}`}
						onChange={(e: ChangeEvent<HTMLInputElement>) =>
							set({ placeholder: e.target.value } as Partial<ArrayItemField>)
						}
						type="text"
						value={subField.placeholder ?? ''}
					/>
				</div>
			)}

			{subField.type === 'textarea' && (
				<div className="field-type text">
					<label className="field-label" htmlFor={`sf-rows-${subField.id}`}>
						Rows
					</label>
					<input
						className="field-type__input"
						id={`sf-rows-${subField.id}`}
						min={1}
						onChange={(e: ChangeEvent<HTMLInputElement>) =>
							set({
								rows: e.target.value ? Number(e.target.value) : 4,
							} as Partial<ArrayItemField>)
						}
						type="number"
						value={subField.rows ?? 4}
					/>
				</div>
			)}

			{hasOptions && 'options' in subField && (
				<OptionsEditor
					onChange={(options) =>
						onChange({ ...subField, options } as ArrayItemField)
					}
					options={subField.options}
				/>
			)}
		</>
	)
}

function AdvancedInputs({ set, subField }: SubFieldInputsProps) {
	return (
		<Stack className={styles.advancedStack}>
			{'hidden' in subField && (
				<div>
					<p className={`field-label ${styles.mb1}`}>
						Visibility: should the field be visible on the frontend?
					</p>
					<CheckboxInput
						checked={subField.hidden}
						label="Hidden"
						onToggle={(e) =>
							set({ hidden: e.target.checked } as Partial<ArrayItemField>)
						}
					/>
				</div>
			)}

			{'errorMessage' in subField && (
				<div className="field-type text">
					<label className="field-label" htmlFor={`sf-errormsg-${subField.id}`}>
						Error Message
					</label>
					<input
						className="field-type__input"
						id={`sf-errormsg-${subField.id}`}
						onChange={(e: ChangeEvent<HTMLInputElement>) =>
							set({ errorMessage: e.target.value } as Partial<ArrayItemField>)
						}
						placeholder="Custom validation error"
						type="text"
						value={subField.errorMessage ?? ''}
					/>
				</div>
			)}

			{'instructions' in subField && (
				<div className="field-type text">
					<label
						className="field-label"
						htmlFor={`sf-instructions-${subField.id}`}
					>
						Instructions
					</label>
					<input
						className="field-type__input"
						id={`sf-instructions-${subField.id}`}
						onChange={(e: ChangeEvent<HTMLInputElement>) =>
							set({ instructions: e.target.value } as Partial<ArrayItemField>)
						}
						placeholder="Help text shown below the field"
						type="text"
						value={subField.instructions ?? ''}
					/>
				</div>
			)}

			{(subField.type === 'text' || subField.type === 'email') && (
				<div className="field-type text">
					<label className="field-label" htmlFor={`sf-default-${subField.id}`}>
						Default Value
					</label>
					<input
						className="field-type__input"
						id={`sf-default-${subField.id}`}
						onChange={(e: ChangeEvent<HTMLInputElement>) =>
							set({ defaultValue: e.target.value } as Partial<ArrayItemField>)
						}
						type={subField.type}
						value={subField.defaultValue ?? ''}
					/>
				</div>
			)}

			{subField.type === 'textarea' && (
				<div className="field-type text">
					<label className="field-label" htmlFor={`sf-default-${subField.id}`}>
						Default Value
					</label>
					<input
						className="field-type__input"
						id={`sf-default-${subField.id}`}
						onChange={(e: ChangeEvent<HTMLInputElement>) =>
							set({ defaultValue: e.target.value } as Partial<ArrayItemField>)
						}
						type="text"
						value={subField.defaultValue ?? ''}
					/>
				</div>
			)}

			{subField.type === 'number' && (
				<div className={styles.twoColGrid}>
					<div className="field-type text">
						<label
							className="field-label"
							htmlFor={`sf-default-${subField.id}`}
						>
							Default Value
						</label>
						<input
							className="field-type__input"
							id={`sf-default-${subField.id}`}
							onChange={(e: ChangeEvent<HTMLInputElement>) =>
								set({
									defaultValue: e.target.value
										? Number(e.target.value)
										: undefined,
								} as Partial<ArrayItemField>)
							}
							type="number"
							value={subField.defaultValue?.toString() ?? ''}
						/>
					</div>
					<div className="field-type text">
						<label className="field-label" htmlFor={`sf-min-${subField.id}`}>
							Minimum
						</label>
						<input
							className="field-type__input"
							id={`sf-min-${subField.id}`}
							onChange={(e: ChangeEvent<HTMLInputElement>) =>
								set({
									min: e.target.value ? Number(e.target.value) : undefined,
								} as Partial<ArrayItemField>)
							}
							type="number"
							value={subField.min?.toString() ?? ''}
						/>
					</div>
					<div className="field-type text">
						<label className="field-label" htmlFor={`sf-max-${subField.id}`}>
							Maximum
						</label>
						<input
							className="field-type__input"
							id={`sf-max-${subField.id}`}
							onChange={(e: ChangeEvent<HTMLInputElement>) =>
								set({
									max: e.target.value ? Number(e.target.value) : undefined,
								} as Partial<ArrayItemField>)
							}
							type="number"
							value={subField.max?.toString() ?? ''}
						/>
					</div>
					<div className="field-type text">
						<label className="field-label" htmlFor={`sf-step-${subField.id}`}>
							Step
						</label>
						<input
							className="field-type__input"
							id={`sf-step-${subField.id}`}
							onChange={(e: ChangeEvent<HTMLInputElement>) =>
								set({
									step: e.target.value ? Number(e.target.value) : undefined,
								} as Partial<ArrayItemField>)
							}
							type="number"
							value={subField.step?.toString() ?? ''}
						/>
					</div>
				</div>
			)}

			{(subField.type === 'text' || subField.type === 'textarea') && (
				<div className={styles.twoColGrid}>
					<div className="field-type text">
						<label className="field-label" htmlFor={`sf-minlen-${subField.id}`}>
							Min Length
						</label>
						<input
							className="field-type__input"
							id={`sf-minlen-${subField.id}`}
							onChange={(e: ChangeEvent<HTMLInputElement>) =>
								set({
									minLength: e.target.value
										? Number(e.target.value)
										: undefined,
								} as Partial<ArrayItemField>)
							}
							type="number"
							value={subField.minLength?.toString() ?? ''}
						/>
					</div>
					<div className="field-type text">
						<label className="field-label" htmlFor={`sf-maxlen-${subField.id}`}>
							Max Length
						</label>
						<input
							className="field-type__input"
							id={`sf-maxlen-${subField.id}`}
							onChange={(e: ChangeEvent<HTMLInputElement>) =>
								set({
									maxLength: e.target.value
										? Number(e.target.value)
										: undefined,
								} as Partial<ArrayItemField>)
							}
							type="number"
							value={subField.maxLength?.toString() ?? ''}
						/>
					</div>
				</div>
			)}

			{subField.type === 'checkbox' && (
				<SelectInput
					hasMany
					isClearable
					label="Default Values"
					name={`sf-default-${subField.id}`}
					onChange={(selected) => {
						const values = selected
							? (selected as { value: string }[]).map((o) => o.value)
							: []
						set({ defaultValue: values } as Partial<ArrayItemField>)
					}}
					options={(subField.options ?? []).map((o) => ({
						label: o.label || o.value,
						value: o.value,
					}))}
					path={`sf-default-${subField.id}`}
					placeholder="Select defaults…"
					value={subField.defaultValue ?? []}
				/>
			)}

			{(subField.type === 'radio' || subField.type === 'select') && (
				<SelectInput
					isClearable
					label="Default Value"
					name={`sf-default-${subField.id}`}
					onChange={(selected) =>
						set({
							defaultValue: selected
								? (selected as { value: string }).value
								: '',
						} as Partial<ArrayItemField>)
					}
					options={(subField.options ?? []).map((o) => ({
						label: o.label || o.value,
						value: o.value,
					}))}
					path={`sf-default-${subField.id}`}
					placeholder="Select default…"
					value={subField.defaultValue ?? ''}
				/>
			)}

			{subField.type === 'date' && (
				<div className={styles.twoColGrid}>
					<div className="field-type date">
						<label className="field-label">Default Value</label>
						<DatePicker
							onChange={(date: Date) =>
								set({
									defaultValue: date ? date.toISOString().split('T')[0] : '',
								} as Partial<ArrayItemField>)
							}
							placeholder="Select date…"
							value={
								subField.defaultValue
									? new Date(subField.defaultValue)
									: undefined
							}
						/>
					</div>
					<div className="field-type date">
						<label className="field-label">Min Date</label>
						<DatePicker
							onChange={(date: Date) =>
								set({
									minDate: date ? date.toISOString().split('T')[0] : '',
								} as Partial<ArrayItemField>)
							}
							placeholder="Select min date…"
							value={subField.minDate ? new Date(subField.minDate) : undefined}
						/>
					</div>
					<div className="field-type date">
						<label className="field-label">Max Date</label>
						<DatePicker
							onChange={(date: Date) => {
								set({
									maxDate: date ? date.toISOString().split('T')[0] : '',
								} as Partial<ArrayItemField>)
							}}
							placeholder="Select max date…"
							value={subField.maxDate ? new Date(subField.maxDate) : undefined}
						/>
					</div>
				</div>
			)}

			{(subField.type === 'toggle' || subField.type === 'consent') && (
				<CheckboxInput
					checked={(subField.defaultValue as boolean) ?? false}
					label="Default Value (on by default)"
					onToggle={(e) =>
						set({ defaultValue: e.target.checked } as Partial<ArrayItemField>)
					}
				/>
			)}

			{subField.type === 'file' && (
				<div className={styles.twoColGrid}>
					<div className="field-type text">
						<label
							className="field-label"
							htmlFor={`sf-filetypes-${subField.id}`}
						>
							Allowed File Types
						</label>
						<input
							className="field-type__input"
							id={`sf-filetypes-${subField.id}`}
							onChange={(e: ChangeEvent<HTMLInputElement>) =>
								set({
									allowedFileTypes: e.target.value,
								} as Partial<ArrayItemField>)
							}
							placeholder=".pdf,.doc,image/*"
							type="text"
							value={subField.allowedFileTypes ?? ''}
						/>
						<p className="field-description">
							Comma-separated extensions or MIME types
						</p>
					</div>
					<div className="field-type text">
						<label
							className="field-label"
							htmlFor={`sf-maxsize-${subField.id}`}
						>
							Max File Size (MB)
						</label>
						<input
							className="field-type__input"
							id={`sf-maxsize-${subField.id}`}
							onChange={(e: ChangeEvent<HTMLInputElement>) =>
								set({
									maxFileSize: e.target.value
										? Number(e.target.value) * 1024 * 1024
										: undefined,
								} as Partial<ArrayItemField>)
							}
							type="number"
							value={
								subField.maxFileSize ? subField.maxFileSize / (1024 * 1024) : ''
							}
						/>
					</div>
					<div className="field-type text">
						<label
							className="field-label"
							htmlFor={`sf-maxfiles-${subField.id}`}
						>
							Max Files
						</label>
						<input
							className="field-type__input"
							id={`sf-maxfiles-${subField.id}`}
							min={1}
							onChange={(e: ChangeEvent<HTMLInputElement>) =>
								set({
									maxFiles: e.target.value ? Number(e.target.value) : undefined,
								} as Partial<ArrayItemField>)
							}
							type="number"
							value={subField.maxFiles?.toString() ?? ''}
						/>
					</div>
					<div className={styles.mt2}>
						<CheckboxInput
							checked={subField.multiple ?? false}
							label="Allow multiple files"
							onToggle={(e) =>
								set({ multiple: e.target.checked } as Partial<ArrayItemField>)
							}
						/>
					</div>
				</div>
			)}
		</Stack>
	)
}

type SubEditorFormProps = {
	onChange: (updated: ArrayItemField) => void
	onClose: () => void
	subField: ArrayItemField
}

export function SubEditorForm({
	onChange,
	onClose,
	subField,
}: SubEditorFormProps) {
	const [draft, setDraft] = React.useState<ArrayItemField>(subField)

	// Reset draft when a different sub-field is selected
	React.useEffect(() => {
		setDraft(subField)
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [subField.id])

	function set(patch: Partial<ArrayItemField>) {
		setDraft((prev) => ({ ...prev, ...patch }) as ArrayItemField)
	}

	function handleChange(updated: ArrayItemField) {
		setDraft(updated)
	}

	return (
		<div className={styles.box}>
			<Stack className={styles.innerStack}>
				<GeneralInputs onChange={handleChange} set={set} subField={draft} />
				<hr className={styles.divider} />
				<AdvancedInputs onChange={handleChange} set={set} subField={draft} />
				<Inline className={styles.actions}>
					<Button data-testid="sub-save-cancel" onClick={onClose}>
						Cancel
					</Button>
					<Button
						data-testid="sub-save-button"
						onClick={() => {
							onChange(draft)
							onClose()
						}}
					>
						Save
					</Button>
				</Inline>
			</Stack>
		</div>
	)
}
