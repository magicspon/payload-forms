# @spon/payload-forms

## 0.1.1

### Patch Changes

- 8221338: Initial release of `@spon/payload-forms` — a Payload CMS plugin providing a visual drag-and-drop form builder with submissions, notifications, and optional multitenancy.

  **Collections registered**
  - `forms` — form definitions with a drag-and-drop field canvas and settings tab
  - `submissions` — submitted data with CSV import and export endpoints
  - `form-uploads` — file attachments from file-type fields

  **Field types**

  Text, email, number, textarea, checkbox, radio, select, date, file, toggle, consent, message, array, and group.

  **Features**
  - Multipage form support
  - Email notifications with configurable rules and conditions
  - CSV export and bulk CSV import with a post-import callback (`onBatchImportComplete`)
  - Multitenancy — opt-in `team` relationship field across all three collections, with a unique index on `(team, slug)`
  - Live preview via a `livePreviewUrl` factory option
  - Lexical rich text integration via `FormFieldReferenceFeature`
  - Per-collection config overrides (access control, extra fields, hooks) via the `collections` option
  - Toggleable feature flags: `confirmations`, `fieldPalette`, `importSchema`, `multipage`, `notifications`

  **Exports**
  - `@spon/payload-forms` — plugin function and shared utilities
  - `@spon/payload-forms/client` — client components
  - `@spon/payload-forms/rsc` — React Server Components
  - `@spon/payload-forms/form` — field prop types and form value types for the frontend renderer
