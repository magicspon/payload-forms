import { z } from 'zod'

// Zod schema matching Lexical's SerializedEditorState
const serializedLexicalNodeSchema = z
  .object({
    type: z.string(),
    version: z.number(),
  })
  .loose()

const serializedRootNodeSchema = z.object({
  type: z.string(),
  children: z.array(serializedLexicalNodeSchema),
  direction: z.union([z.literal('ltr'), z.literal('rtl'), z.null()]),
  format: z.union([
    z.literal('left'),
    z.literal('start'),
    z.literal('center'),
    z.literal('right'),
    z.literal('end'),
    z.literal('justify'),
    z.literal(''),
  ]),
  indent: z.number(),
  version: z.number(),
})

export const serializedEditorStateSchema = z.object({
  root: serializedRootNodeSchema,
})

export type SerializedLexicalNode = z.infer<typeof serializedLexicalNodeSchema>
export type SerializedEditorState = z.infer<typeof serializedEditorStateSchema>

// Condition operators for conditional field visibility
export const conditionOperators = [
  { label: 'is equal to', value: 'equals' },
  { label: 'is not equal to', value: 'notEquals' },
  { label: 'is greater than', value: 'greaterThan' },
  { label: 'is less than', value: 'lessThan' },
  { label: 'is greater than or equal to', value: 'greaterThanOrEquals' },
  { label: 'is less than or equal to', value: 'lessThanOrEquals' },
  { label: 'contains', value: 'contains' },
  { label: 'is empty', value: 'isEmpty' },
  { label: 'is not empty', value: 'isNotEmpty' },
  { label: 'has changed', value: 'hasChanged' },
  { label: 'has not changed', value: 'hasNotChanged' },
] as const

export const conditionOperatorValues = conditionOperators.map((op) => op.value)

const conditionOperatorSchema = z.enum([
  'equals',
  'notEquals',
  'greaterThan',
  'lessThan',
  'greaterThanOrEquals',
  'lessThanOrEquals',
  'contains',
  'isEmpty',
  'isNotEmpty',
  'hasChanged',
  'hasNotChanged',
])

export type ConditionOperator = z.infer<typeof conditionOperatorSchema>

const conditionSchema = z.object({
  field: z.string(), // The field name to watch
  operator: conditionOperatorSchema,
  value: z.union([z.string(), z.number()]).optional(), // Not needed for isEmpty/isNotEmpty
})

export type Condition = z.infer<typeof conditionSchema>

const fieldConditionsSchema = z.object({
  conditions: z.array(conditionSchema),
  logic: z.enum(['and', 'or']),
})

export type FieldConditions = z.infer<typeof fieldConditionsSchema>

const baseSchema = z.object({
  id: z.string(),
  name: z.string().max(100),
  _draft: z.boolean().optional(),
  errorMessage: z.string().optional(),
  hidden: z.boolean(),
  instructions: z.string().optional(),
  label: z.string().max(300),
  required: z.boolean(),
  // Conditional visibility
  conditions: fieldConditionsSchema.optional(),
})

export type BaseField = z.infer<typeof baseSchema>

const optionSchema = z.object({
  label: z.string(),
  value: z.string(),
})

export const textFieldSchemaJson = z.object({
  type: z.literal('text'),
  defaultValue: z.string().optional(),
  maxLength: z.number().int().min(1).optional(),
  minLength: z.number().int().min(0).optional(),
  placeholder: z.string().optional(),
})

export const textFieldSchema = z.object({
  ...baseSchema.shape,
  ...textFieldSchemaJson.shape,
})

export const textareaFieldSchemaJson = z.object({
  type: z.literal('textarea'),
  defaultValue: z.string().optional(),
  maxLength: z.number().int().min(1).optional(),
  minLength: z.number().int().min(0).optional(),
  placeholder: z.string().optional(),
  rows: z.number().int().min(1),
})

export const textareaFieldSchema = z.object({
  ...baseSchema.shape,
  ...textareaFieldSchemaJson.shape,
})

export const emailFieldSchemaJson = z.object({
  type: z.literal('email'),
  defaultValue: z.email().optional().or(z.string().default('')),
  placeholder: z.string().optional(),
})

export const emailFieldSchema = z.object({
  ...baseSchema.shape,
  ...emailFieldSchemaJson.shape,
})

export const numberFieldSchemaJson = z.object({
  type: z.literal('number'),
  defaultValue: z.number().optional(),
  max: z.number().optional(),
  min: z.number().optional(),
  placeholder: z.string().optional(),
  step: z.number().positive().optional(),
})

export const numberFieldSchema = z.object({
  ...baseSchema.shape,
  ...numberFieldSchemaJson.shape,
})

export const checkboxFieldSchemaJson = z.object({
  type: z.literal('checkbox'),
  defaultValue: z.array(z.string()).optional(),
  options: z.array(optionSchema),
})

export const checkboxFieldSchema = z.object({
  ...baseSchema.shape,
  ...checkboxFieldSchemaJson.shape,
})

export const radioFieldSchemaJson = z.object({
  type: z.literal('radio'),
  defaultValue: z.string().optional(),
  options: z.array(optionSchema),
})

export const radioFieldSchema = z.object({
  ...baseSchema.shape,
  ...radioFieldSchemaJson.shape,
})

export const selectFieldSchemaJson = z.object({
  type: z.literal('select'),
  defaultValue: z.string().optional(),
  options: z.array(optionSchema),
  placeholder: z.string().optional(),
})

export const selectFieldSchema = z.object({
  ...baseSchema.shape,
  ...selectFieldSchemaJson.shape,
})

export const dateFieldSchemaJson = z.object({
  type: z.literal('date'),
  defaultValue: z.string().optional(),
  maxDate: z.string().optional(),
  minDate: z.string().optional(),
  placeholder: z.string().optional(),
})

export const dateFieldSchema = z.object({
  ...baseSchema.shape,
  ...dateFieldSchemaJson.shape,
})

export const fileFieldSchemaJson = z.object({
  type: z.literal('file'),
  allowedFileTypes: z.string().optional(), // e.g., ".pdf,.doc,.docx,image/*"
  maxFiles: z.number().int().positive().optional(), // Max number of files (for multiple)
  maxFileSize: z.number().int().positive().optional(), // Max file size in bytes
  multiple: z.boolean().optional(), // Allow multiple file uploads
})

export const fileFieldSchema = z.object({
  ...baseSchema.shape,
  ...fileFieldSchemaJson.shape,
})

export const toggleFieldSchemaJson = z.object({
  type: z.literal('toggle'),
  defaultValue: z.boolean().optional(),
})

export const toggleFieldSchema = z.object({
  ...baseSchema.shape,
  ...toggleFieldSchemaJson.shape,
})

export const consentFieldSchemaJson = z.object({
  type: z.literal('consent'),
  defaultValue: z.boolean().optional(),
})

export const consentFieldSchema = z.object({
  ...baseSchema.shape,
  ...consentFieldSchemaJson.shape,
})

export const messageFieldSchema = z.object({
  id: z.string(),
  type: z.literal('message'),
  _draft: z.boolean().optional(),
  conditions: fieldConditionsSchema.optional(),
  global: z.boolean().optional(),
  richText: serializedEditorStateSchema.optional(),
})

// Sub-field union for array fields — excludes 'message' and 'array'
export const arrayItemFieldSchema = z.discriminatedUnion('type', [
  textFieldSchema,
  textareaFieldSchema,
  emailFieldSchema,
  numberFieldSchema,
  checkboxFieldSchema,
  radioFieldSchema,
  selectFieldSchema,
  dateFieldSchema,
  fileFieldSchema,
  toggleFieldSchema,
  consentFieldSchema,
])

export type ArrayItemField = z.infer<typeof arrayItemFieldSchema>
export type ArrayItemFieldType = ArrayItemField['type']

export const arrayRowSchema = z.object({
  id: z.string(),
  columns: z.array(arrayItemFieldSchema),
})

export type ArrayRow = z.infer<typeof arrayRowSchema>

export const arrayFieldSchemaJson = z.object({
  type: z.literal('array'),
  maxRows: z.number().int().positive().optional(),
  minRows: z.number().int().min(0).optional(),
  rows: z.array(arrayRowSchema),
})

export const arrayFieldSchema = z.object({
  ...baseSchema.shape,
  ...arrayFieldSchemaJson.shape,
})

export const groupFieldSchemaJson = z.object({
  type: z.literal('group'),
  rows: z.array(arrayRowSchema),
})

export const groupFieldSchema = z.object({
  ...baseSchema.shape,
  ...groupFieldSchemaJson.shape,
})

export const fieldSchema = z.discriminatedUnion('type', [
  textFieldSchema,
  textareaFieldSchema,
  emailFieldSchema,
  numberFieldSchema,
  checkboxFieldSchema,
  radioFieldSchema,
  selectFieldSchema,
  dateFieldSchema,
  fileFieldSchema,
  toggleFieldSchema,
  consentFieldSchema,
  messageFieldSchema,
  arrayFieldSchema,
  groupFieldSchema,
])

export type TextField = z.infer<typeof textFieldSchema>
export type TextareaField = z.infer<typeof textareaFieldSchema>
export type EmailField = z.infer<typeof emailFieldSchema>
export type NumberField = z.infer<typeof numberFieldSchema>
export type CheckboxField = z.infer<typeof checkboxFieldSchema>
export type RadioField = z.infer<typeof radioFieldSchema>
export type SelectField = z.infer<typeof selectFieldSchema>
export type DateField = z.infer<typeof dateFieldSchema>
export type FileField = z.infer<typeof fileFieldSchema>
export type ToggleField = z.infer<typeof toggleFieldSchema>
export type ConsentField = z.infer<typeof consentFieldSchema>
export type MessageField = z.infer<typeof messageFieldSchema>
export type ArrayField = z.infer<typeof arrayFieldSchema>
export type GroupField = z.infer<typeof groupFieldSchema>
export type Field = z.infer<typeof fieldSchema>
export type OptionItem = z.infer<typeof optionSchema>
export type FieldType = Field['type']

export type AllFields =
  | ArrayField
  | GroupField
  | CheckboxField
  | ConsentField
  | DateField
  | EmailField
  | FileField
  | MessageField
  | NumberField
  | RadioField
  | SelectField
  | TextareaField
  | TextField
  | ToggleField

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export type EditorBaseProps = {}

export type EditorFormProps = EditorBaseProps & Field

export type TextFieldEditorProps = { field: TextField } & EditorBaseProps
export type TextareaFieldEditorProps = {
  field: TextareaField
} & EditorBaseProps
export type EmailFieldEditorProps = { field: EmailField } & EditorBaseProps
export type NumberFieldEditorProps = { field: NumberField } & EditorBaseProps
export type CheckboxFieldEditorProps = {
  field: CheckboxField
} & EditorBaseProps
export type RadioFieldEditorProps = { field: RadioField } & EditorBaseProps
export type SelectFieldEditorProps = { field: SelectField } & EditorBaseProps
export type DateFieldEditorProps = { field: DateField } & EditorBaseProps
export type FileFieldEditorProps = { field: FileField } & EditorBaseProps
export type ToggleFieldEditorProps = { field: ToggleField } & EditorBaseProps
export type ConsentFieldEditorProps = { field: ConsentField } & EditorBaseProps
export type MessageFieldEditorProps = { field: MessageField } & EditorBaseProps
export type ArrayFieldEditorProps = { field: ArrayField } & EditorBaseProps
export type GroupFieldEditorProps = { field: GroupField } & EditorBaseProps

const baseDefaults = {
  name: '',
  _draft: true,
  errorMessage: '',
  hidden: false,
  instructions: '',
  label: '',
  required: false,
}

/** Creates a field with sensible defaults for the given type. */
export function createDefaultField(id: string, type: FieldType): Field {
  switch (type) {
    case 'array':
      return { ...baseDefaults, id, type, minRows: 0, rows: [] }
    case 'group':
      return { ...baseDefaults, id, type, rows: [] }
    case 'checkbox':
      return {
        ...baseDefaults,
        id,
        type,
        defaultValue: [],
        options: [{ label: '', value: '' }],
      }
    case 'consent':
      return { ...baseDefaults, id, type, defaultValue: false }
    case 'date':
      return { ...baseDefaults, id, type, defaultValue: '', placeholder: '' }
    case 'email':
      return { ...baseDefaults, id, type, defaultValue: '', placeholder: '' }
    case 'file':
      return {
        ...baseDefaults,
        id,
        type,
        allowedFileTypes: '',
        maxFiles: 1,
        maxFileSize: 10 * 1024 * 1024,
        multiple: false,
      }
    case 'message':
      return { id, type, _draft: true, richText: undefined }
    case 'number':
      return { ...baseDefaults, id, type, placeholder: '' }
    case 'radio':
      return {
        ...baseDefaults,
        id,
        type,
        defaultValue: '',
        options: [{ label: '', value: '' }],
      }
    case 'select':
      return {
        ...baseDefaults,
        id,
        type,
        defaultValue: '',
        options: [{ label: '', value: '' }],
        placeholder: '',
      }
    case 'text':
      return { ...baseDefaults, id, type, defaultValue: '', placeholder: '' }
    case 'textarea':
      return {
        ...baseDefaults,
        id,
        type,
        defaultValue: '',
        placeholder: '',
        rows: 4,
      }
    case 'toggle':
      return { ...baseDefaults, id, type, defaultValue: false }
  }
}

export const formSchema = z.object({
  pages: z.array(
    z.object({
      id: z.string(),
      backButton: z.string().optional().default('Back'),
      nextButton: z.string().optional().default('Next'),
      rows: z.array(
        z.object({
          id: z.string(),
          columns: z.array(fieldSchema),
        }),
      ),
      title: z.string(),
    }),
  ),
})

// Simplified message field schema for JSON Schema generation
// (avoids complex nested Lexical types that break Payload's type generator)
const messageFieldSchemaForJsonSchema = z.object({
  id: z.string(),
  type: z.literal('message'),
  _draft: z.boolean().optional(),
  conditions: fieldConditionsSchema.optional(),
  richText: serializedEditorStateSchema.optional(),
})

const arrayFieldSchemaForJsonSchema = z.object({
  ...baseSchema.shape,
  ...arrayFieldSchemaJson.shape,
})

const groupFieldSchemaForJsonSchema = z.object({
  ...baseSchema.shape,
  ...groupFieldSchemaJson.shape,
})

const fieldSchemaForJsonSchema = z.discriminatedUnion('type', [
  textFieldSchema,
  textareaFieldSchema,
  emailFieldSchema,
  numberFieldSchema,
  checkboxFieldSchema,
  radioFieldSchema,
  selectFieldSchema,
  dateFieldSchema,
  fileFieldSchema,
  toggleFieldSchema,
  consentFieldSchema,
  messageFieldSchemaForJsonSchema,
  arrayFieldSchemaForJsonSchema,
  groupFieldSchemaForJsonSchema,
])

const formSchemaForJsonSchema = z.array(
  z.object({
    id: z.string(),
    backButton: z.string().optional(),
    nextButton: z.string().optional(),
    rows: z.array(
      z.object({
        id: z.string(),
        columns: z.array(fieldSchemaForJsonSchema),
      }),
    ),
    title: z.string(),
  }),
)

export const formJSONSchema = z.toJSONSchema(formSchemaForJsonSchema)
