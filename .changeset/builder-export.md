---
"@spon/payload-forms": minor
---

Add `@spon/payload-forms/builder` subpath export for the client-side form builder API.

**New subpath export**

A new entry point exposes the headless form builder utilities so they can be imported without pulling in the full plugin bundle:

```ts
import {
  useFormBuilder,
  buildFormSchema,
  fieldTypes,
} from '@spon/payload-forms/builder'
```

**Exports**

- `useFormBuilder` — headless React hook that manages form page/row/field tree state
- `UseFormBuilderReturn` — TypeScript type for the hook return value
- `buildFormSchema` — converts Zod field definitions to a JSON Schema document
- `fieldTypes` / `FieldTypeValue` — canonical list of supported field type identifiers, useful for rendering a field-type palette
- All `formTree` utilities (`addField`, `moveField`, `removeField`, …) and their associated `FormPage` / `FormRow` types
- All field prop and value types (`TextFieldProps`, `FileFieldValue`, etc.)
- All field schemas and factory functions from the shared `fieldSchema` module
