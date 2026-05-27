---
"@spon/payload-forms": minor
---

Export pure data utilities from `@spon/payload-forms/client`.

The following functions are now available from the `./client` subpath, making them safe to import in browser/client components without pulling in Node.js-only modules:

```ts
import {
  extractFieldsFromPages,
  formatSubmissionValue,
  generateSubmissionsCSV,
  generateTemplateHeaders,
  parseCsvRowToSubmissionData,
} from '@spon/payload-forms/client'

import type { FieldDefinition } from '@spon/payload-forms/client'
```

- `extractFieldsFromPages` — extracts a flat `FieldDefinition[]` from a form's pages structure
- `formatSubmissionValue` — formats a raw submission value for display with type-aware handling
- `generateSubmissionsCSV` — generates a CSV string from submission documents and form pages
- `generateTemplateHeaders` — generates flat CSV template headers, expanding array fields
- `parseCsvRowToSubmissionData` — parses a flat CSV row back to a `submissionData` object with type coercion
- `FieldDefinition` — TypeScript type for a resolved form field (`key`, `label`, `type`, `options`)
