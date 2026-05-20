export const fieldTypes = [
  { label: 'Text', value: 'text' },
  { label: 'TextArea', value: 'textarea' },
  { label: 'Email', value: 'email' },
  { label: 'Number', value: 'number' },
  { label: 'Radio', value: 'radio' },
  { label: 'Checkbox', value: 'checkbox' },
  { label: 'Select', value: 'select' },
  { label: 'Date', value: 'date' },
  { label: 'File', value: 'file' },
  { label: 'Toggle', value: 'toggle' },
  { label: 'Consent', value: 'consent' },
  { label: 'Group', value: 'group' },
  { label: 'Repeater', value: 'array' },
  { label: 'Message', value: 'message' },
] as const

export type FieldTypeValue = (typeof fieldTypes)[number]['value']
