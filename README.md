# @spon/payload-forms

> **Under active development — not ready for production use.**
> The API may change without notice between releases while we work toward a stable 1.0.

A [Payload CMS](https://payloadcms.com) plugin that provides a visual drag-and-drop form builder with submissions, email notifications, CSV import/export, and optional multitenancy.

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
      multitenancy: { enabled: true },
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

| Option | Type | Default | Description |
|---|---|---|---|
| `disabled` | `boolean` | `false` | Disables the plugin while keeping the DB schema intact |
| `slugs` | `Partial<CollectionSlugs>` | — | Override the default collection slugs (`forms`, `submissions`, `form-uploads`) |
| `collections` | `object` | — | Deep-merged overrides for `forms`, `submissions`, and `formUploads` collection configs |
| `features` | `object` | all `true` | Toggle individual features: `confirmations`, `fieldPalette`, `importSchema`, `multipage`, `notifications` |
| `multitenancy` | `object` | — | Adds a `team` relationship field to all collections when `enabled: true` |
| `localeOptions` | `{ label, value }[]` | English only | Languages available in the form editor |
| `livePreviewUrl` | `function` | — | Returns the preview URL for a form; omit to disable live preview |
| `exportAccessCheck` | `(req) => boolean` | `() => true` | Guards the CSV export endpoint |
| `importAccessCheck` | `(req) => boolean` | `() => true` | Guards the CSV import endpoint |
| `onBatchImportComplete` | `function` | — | Called once after a successful batch CSV import |
| `settings` | `Field[]` | `[]` | Extra fields injected into the form settings tab |
| `tabs` | `Tab[]` | `[]` | Extra tabs added to the form editor |
| `tabLabels` | `{ canvas, settings }` | `{ canvas: 'Canvas', settings: 'Settings' }` | Override the default tab labels |

## Exports

| Export path | Contents |
|---|---|
| `@spon/payload-forms` | Plugin function, collection option types, shared utilities |
| `@spon/payload-forms/client` | Client components (requires `'use client'`) |
| `@spon/payload-forms/rsc` | React Server Components |
| `@spon/payload-forms/form` | Field prop types and form value types for the frontend form renderer |

## Collections registered

The plugin adds three collections to your Payload config:

- **forms** (default slug: `forms`) — form definitions, field canvas, settings
- **submissions** (default slug: `submissions`) — submitted data with CSV import/export endpoints
- **form-uploads** (default slug: `form-uploads`) — file attachments from file-type fields

## License

MIT
