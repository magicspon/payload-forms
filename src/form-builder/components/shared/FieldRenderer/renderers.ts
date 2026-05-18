import type { FieldType } from '@/shared/fieldSchema'

import { ArrayFieldEditor } from '@/form-builder/components/fields/ArrayFieldEditor'
import { CheckboxFieldEditor } from '@/form-builder/components/fields/CheckboxFieldEditor'
import { ConsentFieldEditor } from '@/form-builder/components/fields/ConsentFieldEditor'
import { DateFieldEditor } from '@/form-builder/components/fields/DateFieldEditor'
import { EmailFieldEditor } from '@/form-builder/components/fields/EmailFieldEditor'
import { FileFieldEditor } from '@/form-builder/components/fields/FileFieldEditor'
import { MessageFieldEditor } from '@/form-builder/components/fields/MessageFieldEditor'
import { NumberFieldEditor } from '@/form-builder/components/fields/NumberFieldEditor'
import { RadioFieldEditor } from '@/form-builder/components/fields/RadioFieldEditor'
import { SelectFieldEditor } from '@/form-builder/components/fields/SelectFieldEditor'
import { TextareaFieldEditor } from '@/form-builder/components/fields/TextareaFieldEditor'
import { TextFieldEditor } from '@/form-builder/components/fields/TextFieldEditor'
import { ToggleFieldEditor } from '@/form-builder/components/fields/ToggleFieldEditor'

// satisfies enforces exhaustiveness: TypeScript errors if any FieldType is missing
export const renderers = {
	array: ArrayFieldEditor,
	checkbox: CheckboxFieldEditor,
	consent: ConsentFieldEditor,
	date: DateFieldEditor,
	email: EmailFieldEditor,
	file: FileFieldEditor,
	message: MessageFieldEditor,
	number: NumberFieldEditor,
	radio: RadioFieldEditor,
	select: SelectFieldEditor,
	text: TextFieldEditor,
	textarea: TextareaFieldEditor,
	toggle: ToggleFieldEditor,
} satisfies Record<FieldType, unknown>
