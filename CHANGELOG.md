# @spon/payload-forms

## 0.6.0

### Minor Changes

- 1d30a3f: Add `@spon/payload-forms/builder` subpath export for the client-side form builder API.

  **New subpath export**

  A new entry point exposes the headless form builder utilities so they can be imported without pulling in the full plugin bundle:

  ```ts
  import { useFormBuilder, buildFormSchema, fieldTypes } from '@spon/payload-forms/builder'
  ```

  **Exports**
  - `useFormBuilder` — headless React hook that manages form page/row/field tree state
  - `UseFormBuilderReturn` — TypeScript type for the hook return value
  - `buildFormSchema` — converts Zod field definitions to a JSON Schema document
  - `fieldTypes` / `FieldTypeValue` — canonical list of supported field type identifiers, useful for rendering a field-type palette
  - All `formTree` utilities (`addField`, `moveField`, `removeField`, …) and their associated `FormPage` / `FormRow` types
  - All field prop and value types (`TextFieldProps`, `FileFieldValue`, etc.)
  - All field schemas and factory functions from the shared `fieldSchema` module

## 0.5.0

### Minor Changes

- 7350bf5: Add CC/BCC fields to email notifications and a `beforeEmail` hook.

  **CC and BCC recipients**

  Each notification rule in the **Notifications** tab now has optional **CC** and **BCC** fields alongside the existing **To** field. All three support plain email addresses, comma-separated lists, and `{{fieldName}}` tokens that resolve to submission values at send time.

  **`beforeEmail` hook**

  A new `beforeEmail` option on `formsPlugin` lets you intercept each outgoing notification email before it is sent. The hook receives the fully resolved email data — tokens already substituted, Lexical content already converted to HTML and plain text — and can suppress `payload.sendEmail()` by returning `false`.

  ```ts
  import { formsPlugin, type BeforeEmailHook } from '@spon/payload-forms'

  const beforeEmail: BeforeEmailHook = async ({ to, cc, bcc, subject, html, text }) => {
    await myEmailService.send({ to, cc, bcc, subject, html, text })
    return false // skip payload.sendEmail()
  }

  export default buildConfig({
    plugins: [formsPlugin({ beforeEmail })],
  })
  ```

  The hook is called once per notification item. Returning `false` cancels the send for that item only — other rules still fire. If the hook throws, the error is logged and the send proceeds normally.

## 0.4.0

### Minor Changes

- 0801500: Replace the hardcoded `from` submission field with a configurable `identifier` field.

  **Breaking change:** the `from` field on the `submissions` collection has been renamed to `identifier`. Run `payload migrate` after upgrading to apply the schema change.
  - Forms now have an **Identifier Field** selector in the Settings tab. Editors pick any scalar form field (text, email, number, select, etc.) whose value will be stored as the submission identifier, shown in the submissions list.
  - The public submission endpoint no longer accepts or validates a `from` body field. The identifier is derived server-side from `submissionData` at submission time.
  - CSV exports use `Identifier` as the column header instead of `From`.
  - The Settings tab is now rendered correctly (previously `settings` plugin option fields were registered but never displayed).

## 0.3.0

### Minor Changes

- 1e01d3b: Replace DnD library, move field palette to sidebar, add cross-page row drag, and tighten field validation.

  ## DnD library swap

  Replaced `@dnd-kit` with `@atlaskit/pragmatic-drag-and-drop`. The new library integrates better with Payload's admin UI and enables the field palette to live in the sidebar alongside the canvas rather than above it.

  ## Field palette in sidebar

  The field palette is now rendered in the sidebar via a shared DnD provider, freeing up vertical space in the canvas area.

  ## Cross-page row drag

  Rows can now be dragged between pages in a multi-page form. Hover over a page tab for 600 ms to switch to that page, then drop the row before or after any existing row, or onto the bottom drop zone to append it. If the source page becomes empty after a move, an empty row is left in place so the page remains valid.

  ## Server-side field validation

  The forms collection now validates on save that every non-message field has both a `label` and a `name` set. Fields missing either value are rejected with a `400` and the offending field IDs are reported in the error.

  ## `_draft` flag removed

  The internal `_draft` boolean has been removed from the field schema. Fields are now valid or invalid at save time — there is no intermediate draft state.

  ## "Array" renamed to "Repeater"

  The repeatable field type is now labelled **Repeater** in the field palette and type selectors.

  ## Slug uniqueness

  The `slug` field on the forms collection now enforces a unique index. If you are upgrading an existing database that contains duplicate slugs, de-duplicate them before running migrations.

## 0.2.0

### Minor Changes

- 23af5fe: Remove built-in multitenancy support.

  The `multitenancy` option has been removed from `FormsPluginConfig`. The plugin no longer injects a `team` relationship field, unique `(team, slug)` index, or any team-aware logic into the registered collections.

  **Why:** the multitenancy implementation made assumptions about the host app's data model (a `teams` collection with `teamMembers`, `role`, and `user` fields) that don't hold in general. Users who need multitenancy can add their own relationship field via the `collections` override and handle access control in their own hooks.

  **Breaking changes:**
  - `FormsPluginConfig.multitenancy` removed — delete this option from your plugin config.
  - The `{{team}}` email token in the Notifications tab no longer resolves to anything — remove it from any notification rules that use it.
  - The public submission endpoint and CSV import endpoint no longer copy `team` from the form onto created submissions and uploads — if you relied on this propagation, add a `beforeChange` hook to the submissions collection.
  - `FormImportButton` (CSV import UI) now shows a flat form list instead of a team-scoped picker.

## 0.1.3

### Patch Changes

- ec84554: Fix `Module not found` errors caused by unresolved `@/` path aliases in the published package. Switched build tooling from `@swc/cli` + `tsc` + `copyfiles` to `tsdown`, which resolves all TypeScript path aliases to relative imports during compilation.

  Also moves `@tailwindcss/postcss`, `@tanstack/react-form`, `@tanstack/store`, `class-variance-authority`, and `tailwindcss` from dependencies to devDependencies, as they are build-time requirements and not needed by consumers of the package.

## 0.1.2

### Patch Changes

- 7d018ff: Move `@tailwindcss/postcss`, `@tanstack/react-form`, `@tanstack/store`, `class-variance-authority`, and `tailwindcss` from dependencies to devDependencies, as they are build-time requirements and not needed by consumers of the package.

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
