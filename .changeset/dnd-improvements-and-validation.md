---
'@spon/payload-forms': minor
---

Replace DnD library, move field palette to sidebar, add cross-page row drag, and tighten field validation.

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
