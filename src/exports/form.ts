import type { z } from 'zod'

import type {
  arrayFieldSchema,
  checkboxFieldSchema,
  consentFieldSchema,
  dateFieldSchema,
  emailFieldSchema,
  fileFieldSchema,
  groupFieldSchema,
  messageFieldSchema,
  numberFieldSchema,
  radioFieldSchema,
  selectFieldSchema,
  textareaFieldSchema,
  textFieldSchema,
  toggleFieldSchema,
} from '../shared/fieldSchema'

export type { Field, FieldConditions } from '../shared/fieldSchema'

export type TextFieldProps = z.infer<typeof textFieldSchema>
export type EmailFieldProps = z.infer<typeof emailFieldSchema>
export type NumberFieldProps = z.infer<typeof numberFieldSchema>
export type TextareaFieldProps = z.infer<typeof textareaFieldSchema>
export type CheckboxFieldProps = z.infer<typeof checkboxFieldSchema>
export type RadioFieldProps = z.infer<typeof radioFieldSchema>
export type SelectFieldProps = z.infer<typeof selectFieldSchema>
export type DateFieldProps = z.infer<typeof dateFieldSchema>
export type FileFieldProps = z.infer<typeof fileFieldSchema>
export type ToggleFieldProps = z.infer<typeof toggleFieldSchema>
export type ConsentFieldProps = z.infer<typeof consentFieldSchema>
export type MessageFieldProps = z.infer<typeof messageFieldSchema>
export type ArrayFieldProps = z.infer<typeof arrayFieldSchema>
export type GroupFieldProps = z.infer<typeof groupFieldSchema>

export type NamedFieldProps =
  | TextFieldProps
  | EmailFieldProps
  | NumberFieldProps
  | TextareaFieldProps
  | CheckboxFieldProps
  | RadioFieldProps
  | SelectFieldProps
  | DateFieldProps
  | FileFieldProps
  | ToggleFieldProps
  | ConsentFieldProps
  | ArrayFieldProps
  | GroupFieldProps

export type LocalFileValue = {
  file: File
  kind: 'local'
  previewUrl?: string
}

export type RemoteFileValue = {
  filename: string
  filesize: number
  id: string
  kind: 'remote'
  mimeType: string
  url: string
}

export type FileFieldValue = Array<LocalFileValue | RemoteFileValue>

export type ArrayItemValue = Record<string, string | number | boolean | string[] | File[]>

export type FormFieldValue =
  | string
  | number
  | boolean
  | string[]
  | FileFieldValue
  | ArrayItemValue
  | ArrayItemValue[]
