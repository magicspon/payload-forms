import { z } from 'zod'
import type {
	FormFieldValue,
	MessageFieldProps,
	NamedFieldProps,
} from '@spon/payload-forms/form'

export type { FormFieldValue, NamedFieldProps, MessageFieldProps }

export type FormValues = Record<string, FormFieldValue>

export type FormField = NamedFieldProps | MessageFieldProps

export interface FormRow {
	id: string
	columns: FormField[]
}

export interface FormPage {
	id: string
	title: string
	backButton?: string
	nextButton?: string
	rows: FormRow[]
}

export interface FieldRendererProps {
	field: FormField
	values: FormValues
	validatorCache: Map<string, z.ZodTypeAny>
	showHidden?: boolean
}
