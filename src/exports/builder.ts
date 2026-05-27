'use client'

// Headless state hook
export { useFormBuilder } from '../form-builder/hooks/useFormBuilder'
export type { UseFormBuilderReturn } from '../form-builder/hooks/useFormBuilder'

// Zod fields → JSON Schema
export { buildFormSchema } from '../form-builder/utils/buildFormSchema'

// Field type list for building a field palette
export { fieldTypes } from '../form-builder/utils/fieldTypes'

export type { FieldTypeValue } from '../form-builder/utils/fieldTypes'
// Pure tree-manipulation utils + FormPage / FormRow types
export * from '../form-builder/utils/formTree'

// Field schemas, types, and factory function
export * from '../shared/fieldSchema'

// Convenience field prop aliases + form value types
export type {
  ArrayFieldProps,
  ArrayItemValue,
  CheckboxFieldProps,
  ConsentFieldProps,
  DateFieldProps,
  EmailFieldProps,
  FileFieldProps,
  FileFieldValue,
  FormFieldValue,
  GroupFieldProps,
  LocalFileValue,
  MessageFieldProps,
  NamedFieldProps,
  NumberFieldProps,
  RadioFieldProps,
  RemoteFileValue,
  SelectFieldProps,
  TextareaFieldProps,
  TextFieldProps,
  ToggleFieldProps,
} from './form'
