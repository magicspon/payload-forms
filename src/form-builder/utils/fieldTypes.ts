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
	{ label: 'Message', value: 'message' },
	{ label: 'Toggle', value: 'toggle' },
	{ label: 'Consent', value: 'consent' },
	{ label: 'Array', value: 'array' },
	{ label: 'Group', value: 'group' },
] as const

export type FieldTypeValue = (typeof fieldTypes)[number]['value']
