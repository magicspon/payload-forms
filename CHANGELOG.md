# @spon/payload-forms

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
