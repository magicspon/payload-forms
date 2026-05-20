# @spon/payload-forms

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
