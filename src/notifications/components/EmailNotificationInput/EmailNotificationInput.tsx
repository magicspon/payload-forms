'use client'

import type { TextFieldClientProps } from 'payload'

import { camelCase } from '@/shared/utils/camelCase'
import { Popup, PopupList, useField } from '@payloadcms/ui'
import * as React from 'react'
import { z } from 'zod'

import styles from './EmailNotificationInput.module.css'

type FormPage = {
	rows?: Array<{
		columns?: Array<{
			label?: string
			name?: string
			type?: string
		}>
	}>
}

const emailSchema = z.email()

const TOKEN_RE = /^\{\{.+\}\}$/

function isToken(value: string): boolean {
	return TOKEN_RE.test(value.trim())
}

function parseTokens(raw: string): string[] {
	return raw
		.split(',')
		.map((s) => s.trim())
		.filter(Boolean)
}

function serializeTokens(tokens: string[]): string {
	return tokens.join(',')
}

// ---- Chip ---------------------------------------------------------------

type ChipProps = {
	onRemove: () => void
	value: string
}

function Chip({ onRemove, value }: ChipProps) {
	const token = isToken(value)
	return (
		<span
			className={styles.chip}
			data-token={token || undefined}
		>
			{value}
			<button
				aria-label={`Remove ${value}`}
				className={styles.chipRemove}
				onClick={onRemove}
				type="button"
			>
				×
			</button>
		</span>
	)
}

// ---- Main component ------------------------------------------------------

export function EmailNotificationInput({ path }: TextFieldClientProps) {
	const { setValue, value = '' } = useField<string>({ path: path ?? 'email' })
	const { value: pages = [] } = useField<FormPage[]>({ path: 'pages' })

	const [inputValue, setInputValue] = React.useState('')
	const [inputError, setInputError] = React.useState<null | string>(null)

	const tokens = React.useMemo(() => parseTokens(value), [value])

	const formFields = React.useMemo(() => {
		if (!pages?.length) {return []}
		return pages
			.flatMap((page) => page.rows?.flatMap((row) => row.columns ?? []) ?? [])
			.filter(
				(field): field is { label: string; name: string; type: string } =>
					!!field && field.type === 'email' && !!field.name,
			)
			.map((field) => ({
				name: camelCase(field.name),
				label: field.label || field.name,
			}))
	}, [pages])

	const addToken = React.useCallback(
		(token: string) => {
			const trimmed = token.trim()
			if (!trimmed || tokens.includes(trimmed)) {return}
			setValue(serializeTokens([...tokens, trimmed]))
		},
		[tokens, setValue],
	)

	const removeToken = React.useCallback(
		(index: number) => {
			const next = tokens.filter((_, i) => i !== index)
			setValue(serializeTokens(next))
		},
		[tokens, setValue],
	)

	const commitInput = React.useCallback(() => {
		const trimmed = inputValue.trim()
		if (!trimmed) {return}
		if (!isToken(trimmed)) {
			const result = emailSchema.safeParse(trimmed)
			if (!result.success) {
				setInputError('Enter a valid email address')
				return
			}
		}
		setInputError(null)
		addToken(trimmed)
		setInputValue('')
	}, [inputValue, addToken])

	const handleKeyDown = React.useCallback(
		(e: React.KeyboardEvent<HTMLInputElement>) => {
			if (e.key === 'Enter' || e.key === ',') {
				e.preventDefault()
				commitInput()
			} else if (
				e.key === 'Backspace' &&
				inputValue === '' &&
				tokens.length > 0
			) {
				removeToken(tokens.length - 1)
			}
		},
		[commitInput, inputValue, tokens, removeToken],
	)

	return (
		<div className="field-type text">
			<label className="field-label" htmlFor="notification-email-input">
				Email
				<span className="required">*</span>
			</label>

			<div className={styles.inputWrapper}>
				{tokens.map((token, i) => (
					<Chip
						key={`${token}-${i}`}
						onRemove={() => removeToken(i)}
						value={token}
					/>
				))}
			</div>
			<div className={styles.inputWrapper}>
				<input
					aria-invalid={!!inputError}
					className={styles.input}
					id="notification-email-input"
					onBlur={commitInput}
					onChange={(e) => {
						setInputValue(e.target.value)
						if (inputError) {setInputError(null)}
					}}
					onKeyDown={handleKeyDown}
					placeholder={
						tokens.length === 0 ? 'Enter email or insert token…' : ''
					}
					type="email"
					value={inputValue}
				/>

				<Popup
					button={
						<button
							aria-label="Insert token"
							className={styles.insertButton}
							type="button"
						>
							<span>{'{ }'}</span>
							<span>Insert</span>
						</button>
					}
					buttonType="custom"
				>
					<PopupList.ButtonGroup>
						<PopupList.Button onClick={() => addToken('{{team}}')}>
							Team email{' '}
							<span className={styles.muted}>{'{{team}}'}</span>
						</PopupList.Button>
						{formFields.map((field) => (
							<PopupList.Button
								key={field.name}
								onClick={() => addToken(`{{${field.name}}}`)}
							>
								{field.label}{' '}
								<span className={styles.muted}>{`{{${field.name}}}`}</span>
							</PopupList.Button>
						))}
					</PopupList.ButtonGroup>
				</Popup>
			</div>
			{inputError && (
				<p className={`field-error ${styles.errorText}`}>{inputError}</p>
			)}
		</div>
	)
}
