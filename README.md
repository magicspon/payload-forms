# @spon/payload-forms

> **Under active development — not ready for production use.**
> The API may change without notice between releases while we work toward a stable 1.0.

A [Payload CMS](https://payloadcms.com) plugin that provides a visual drag-and-drop form builder with submissions, email notifications, CSV import/export.

## Requirements

- Payload `^3.84.1`
- React `^19.0.0`
- Node `^18.20.2 || >=20.9.0`

## Installation

```sh
pnpm add @spon/payload-forms
```

## Usage

```ts
import { buildConfig } from 'payload'
import { formsPlugin } from '@spon/payload-forms'

export default buildConfig({
  plugins: [
    formsPlugin({
      localeOptions: [
        { label: 'English', value: 'en' },
        { label: 'Spanish', value: 'es' },
      ],
      collections: {
        forms: {
          access: { create: isAdminOrMember, read: isAnyone },
        },
      },
    }),
  ],
})
```

## Plugin options

| Option                  | Type                       | Default                                      | Description                                                                                               |
| ----------------------- | -------------------------- | -------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `disabled`              | `boolean`                  | `false`                                      | Disables the plugin while keeping the DB schema intact                                                    |
| `slugs`                 | `Partial<CollectionSlugs>` | —                                            | Override the default collection slugs (`forms`, `submissions`, `form-uploads`)                            |
| `collections`           | `object`                   | —                                            | Deep-merged overrides for `forms`, `submissions`, and `formUploads` collection configs                    |
| `features`              | `object`                   | all `true`                                   | Toggle individual features: `confirmations`, `fieldPalette`, `importSchema`, `multipage`, `notifications` |
| `localeOptions`         | `{ label, value }[]`       | English only                                 | Languages available in the form editor                                                                    |
| `livePreviewUrl`        | `function`                 | —                                            | Returns the preview URL for a form; omit to disable live preview                                          |
| `exportAccessCheck`     | `(req) => boolean`         | `() => true`                                 | Guards the CSV export endpoint                                                                            |
| `importAccessCheck`     | `(req) => boolean`         | `() => true`                                 | Guards the CSV import endpoint                                                                            |
| `onBatchImportComplete` | `function`                 | —                                            | Called once after a successful batch CSV import                                                           |
| `settings`              | `Field[]`                  | `[]`                                         | Extra fields injected into the form settings tab                                                          |
| `tabs`                  | `Tab[]`                    | `[]`                                         | Extra tabs added to the form editor                                                                       |
| `tabLabels`             | `{ canvas, settings }`     | `{ canvas: 'Canvas', settings: 'Settings' }` | Override the default tab labels                                                                           |

## Exports

| Export path                  | Contents                                                             |
| ---------------------------- | -------------------------------------------------------------------- |
| `@spon/payload-forms`        | Plugin function, collection option types, shared utilities           |
| `@spon/payload-forms/client` | Client components (requires `'use client'`)                          |
| `@spon/payload-forms/rsc`    | React Server Components                                              |
| `@spon/payload-forms/form`   | Field prop types and form value types for the frontend form renderer |

## Collections registered

The plugin adds three collections to your Payload config:

- **forms** (default slug: `forms`) — form definitions, field canvas, settings
- **submissions** (default slug: `submissions`) — submitted data with CSV import/export endpoints
- **form-uploads** (default slug: `form-uploads`) — file attachments from file-type fields

## Field types

All fields share a common set of base properties (`name`, `label`, `required`, `hidden`, `instructions`, `errorMessage`, `conditions`) unless noted.

| Type | Description | Key options |
| -------- | -------------------------------------------------- | ----------------------------------------------- |
| `text` | Single-line text input | `placeholder`, `defaultValue`, `minLength`, `maxLength` |
| `textarea` | Multi-line text input | `placeholder`, `defaultValue`, `minLength`, `maxLength`, `rows` |
| `email` | Email address input with format validation | `placeholder`, `defaultValue` |
| `number` | Numeric input | `placeholder`, `defaultValue`, `min`, `max`, `step` |
| `radio` | Single-select radio buttons | `options[]`, `defaultValue` |
| `checkbox` | Multi-select checkboxes | `options[]`, `defaultValue[]` |
| `select` | Dropdown select | `options[]`, `placeholder`, `defaultValue` |
| `date` | Date picker | `placeholder`, `defaultValue`, `minDate`, `maxDate` |
| `file` | File upload (stored in form-uploads collection) | `maxFiles`, `maxFileSize`, `allowedFileTypes`, `relationTo` |
| `toggle` | Boolean toggle switch | `defaultValue` |
| `consent` | Consent/agreement checkbox | `defaultValue` |
| `group` | Groups sub-fields into a single named object | `rows[]` |
| `array` (Repeater) | Repeatable group of sub-fields | `rows[]`, `minRows`, `maxRows` |
| `message` | Display-only rich text block (no data captured) | `richText` (Lexical), `conditions` |

## Conditional visibility

Every field (except `message`) supports a `conditions` object that controls when it is shown. Conditions are evaluated client-side by the form renderer.

```ts
conditions: {
  logic: 'and' | 'or',
  conditions: [
    {
      field: 'country',          // name of the field to watch
      operator: 'equals',        // see operators below
      value: 'US',
    },
  ],
}
```

Supported operators: `equals`, `notEquals`, `greaterThan`, `lessThan`, `greaterThanOrEquals`, `lessThanOrEquals`, `contains`, `isEmpty`, `isNotEmpty`, `hasChanged`, `hasNotChanged`.

## Multi-page forms

When the `multipage` feature is enabled (default), a form can contain multiple pages. Each page has a `title`, configurable `nextButton` / `backButton` labels, and its own set of field rows. The form canvas shows a tab per page in the admin editor.

## Confirmations

When `features.confirmations` is enabled (default), a **Confirmation** tab appears on each form with two options:

- **Message** — display a rich text message after submission (supports `{{fieldName}}` tokens)
- **Redirect** — redirect the user to a specified URL after submission

## Email notifications

When `features.notifications` is enabled (default), a **Notifications** tab lets editors configure one or more email rules per form. Each rule has:

- **To** — a comma-separated list of plain addresses and/or `{{fieldName}}` tokens that resolve to submission values
- **Subject** — plain text
- **Message** — rich text editor with `FormFieldReferenceFeature` for inserting live field values
- **Conditions** — optional rule-level conditions; the email is only sent when all conditions match the submission data

Email failures never roll back the submission.

## Spam protection

The public submission endpoint includes two built-in spam defences:

- **Honeypot** — a hidden `_hp` field; any non-empty value returns a fake-success response without saving data
- **Timing check** — submissions arriving in under 2 seconds (production only) are silently swallowed

## Submissions & CSV

The submissions collection exposes two extra endpoints on top of the standard Payload REST API:

| Endpoint | Method | Description |
| -------- | ------ | ----------- |
| `/api/submissions/:id/export` | `GET` | Downloads a CSV of all submissions for a form |
| `/api/submissions/import` | `POST` | Bulk-imports submissions from a CSV file |

Guarded by `exportAccessCheck` and `importAccessCheck` respectively (defaults to public). The CSV template matches the form schema and can be downloaded from the admin UI via **FormCSVTemplateButton**.

When a batch import completes, `onBatchImportComplete` is called once with `{ payload, formId, count }` — use this to trigger a single consolidated notification instead of per-row emails.

## Schema import

Setting `features.importSchema: true` adds an **Import** tab to the form editor. Editors can paste or upload a JSON document that matches the form schema and it will be loaded directly into the canvas — useful for seeding forms programmatically or migrating from another tool.

## Lexical feature

`FormFieldReferenceFeature` adds a toolbar item to any Lexical rich text editor that lets editors insert a reference to a form field. At render time the reference is replaced with the actual submission value. Import it from the main entry point and add it to your Lexical config:

```ts
import { FormFieldReferenceFeature } from '@spon/payload-forms'

lexicalEditor({
  features: [FormFieldReferenceFeature()],
})
```

## Public submission endpoint

The plugin registers a public REST endpoint for accepting form submissions from your front end:

```
POST /api/submissions/:formId
Content-Type: multipart/form-data
```

| Field | Required | Description |
| ----- | -------- | ----------- |
| `identifier` | yes | Submitter identifier (≤ 255 chars) |
| `submissionData` | yes | JSON-encoded `Record<string, FormFieldValue>` |
| `_hp` | — | Honeypot (leave empty) |
| `_ts` | — | ISO timestamp of when the form was first rendered |
| `_userAgent` | — | Client user agent (falls back to request header) |
| `_ipAddress` | — | Client IP (falls back to `x-forwarded-for`) |
| `<file fields>` | — | One `File` entry per upload, keyed by field name |

On success the endpoint returns `{ id: string, success: true }` plus the resolved confirmation (message or redirect URL).

## Front-end rendering

Import field prop types and form value types from `@spon/payload-forms/form` to build a type-safe custom form renderer:

```ts
import type {
  Field,
  TextFieldProps,
  EmailFieldProps,
  FileFieldValue,
  FormFieldValue,
  NamedFieldProps,
} from '@spon/payload-forms/form'
```

`buildFormSchema` (available from both the main entry and `/client`) converts the stored `pages` structure into a flat Zod schema keyed by field name, which you can use to validate the `submissionData` payload before sending.

## License

MIT
