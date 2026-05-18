import type { FieldType } from '../../../fieldSchema'

import { ArrayFieldEditor } from '../ArrayFieldEditor'
import { CheckboxFieldEditor } from '../CheckboxFieldEditor'
import { ConsentFieldEditor } from '../ConsentFieldEditor'
import { DateFieldEditor } from '../DateFieldEditor'
import { EmailFieldEditor } from '../EmailFieldEditor'
import { FileFieldEditor } from '../FileFieldEditor'
import { MessageFieldEditor } from '../MessageFieldEditor'
import { NumberFieldEditor } from '../NumberFieldEditor'
import { RadioFieldEditor } from '../RadioFieldEditor'
import { SelectFieldEditor } from '../SelectFieldEditor'
import { TextareaFieldEditor } from '../TextareaFieldEditor'
import { TextFieldEditor } from '../TextFieldEditor'
import { ToggleFieldEditor } from '../ToggleFieldEditor'

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
