# Refactor Plan — Sunday 2026-05-18

Six agreed changes. Work in this order: easy/isolated first, structural middle, UI last.

---

## 1. Inline `attemptAsync`, remove `es-toolkit`

**Goal:** Zero new behaviour. Exact clone of the es-toolkit tuple pattern.

**New file:** `src/shared/utils/attemptAsync.ts`
```ts
export async function attemptAsync<T>(
  fn: () => Promise<T>,
): Promise<[Error, undefined] | [null, T]> {
  try {
    return [null, await fn()]
  } catch (err) {
    return [err instanceof Error ? err : new Error(String(err)), undefined]
  }
}
```

**Steps:**
1. Create `src/shared/utils/attemptAsync.ts` with the above.
2. Find all 14 imports of `attemptAsync` from `es-toolkit` — `grep -r "es-toolkit" src --include="*.ts" --include="*.tsx" -l`
3. Replace each import path with the new location.
4. Remove `es-toolkit` from `package.json` dependencies.
5. Run unit tests: `pnpm test` — must still be 256/256.

---

## 2. Replace `nanoid` with `crypto.randomUUID()`

**Goal:** Same API, same call sites, zero dep.

**Edit:** `src/lib/utils/nanoid.ts`
```ts
export const nanoid = () => crypto.randomUUID()
```

**Steps:**
1. Replace the file content (one line — no import needed, `crypto` is global in Node 18+).
2. Remove `nanoid` from `package.json` dependencies.
3. Run unit tests.

> Note: IDs go from 7-char lowercase alphanumeric to 36-char UUID. No existing data to migrate.

---

## 3. Refactor `FieldRenderer`, remove `ts-pattern`

**Goal:** Lookup map with `satisfies` for compile-time exhaustiveness. Strict prop types throughout.

**Edit:** `src/components/fields/FieldRenderer/FieldRenderer.tsx`

Replace `match(field).with(...).exhaustive()` with:

```ts
import type { ComponentType } from 'react'
import type { EditorFormProps } from '...'

type RendererMap = Record<FieldType, ComponentType<EditorFormProps>>

const renderers = {
  text: TextFieldEditor,
  email: EmailFieldEditor,
  textarea: TextareaFieldEditor,
  number: NumberFieldEditor,
  select: SelectFieldEditor,
  radio: RadioFieldEditor,
  checkbox: CheckboxFieldEditor,
  toggle: ToggleFieldEditor,
  date: DateFieldEditor,
  file: FileFieldEditor,
  array: ArrayFieldEditor,
  message: MessageFieldEditor,
  consent: ConsentFieldEditor,
} satisfies RendererMap

export function FieldRenderer(props: EditorFormProps) {
  const { value: handle } = useField<'string'>({ path: 'handle' })
  const Component = renderers[props.type]
  return <Component {...props} handle={handle} />
}
```

**Steps:**
1. Define `RendererMap` using the actual `FieldType` union from `src/fieldSchema.ts`.
2. Build the `renderers` map with `satisfies RendererMap` — TypeScript errors if any type is missing.
3. Audit all editor component prop types — no `any`, no implicit `unknown`. Fix any that are loose.
4. Remove `ts-pattern` from `package.json` dependencies.
5. Run `pnpm tsc --noEmit` — zero errors.

---

## 4. Remove `@base-ui/react`, replace with `@payloadcms/ui`

Four sub-tasks. Each is independent — do them in any order.

### 4a. Tabs → remove entirely (flat field editors + Payload custom views)

**Field editors** (`TextFieldEditor`, `EmailFieldEditor`, etc.) — all use `Tabs.Root/List/Tab/Panel` to section settings. Replace with flat scrollable form: remove the `Tabs.*` wrappers, keep all the field inputs, add `<h3>` or `<hr>` dividers between logical sections if needed.

Files to edit (check each for `@base-ui/react`):
- `src/components/fields/TextFieldEditor/TextFieldEditor.tsx`
- `src/components/fields/EmailFieldEditor/EmailFieldEditor.tsx`
- `src/components/fields/TextareaFieldEditor/TextareaFieldEditor.tsx`
- `src/components/fields/NumberFieldEditor/NumberFieldEditor.tsx`
- `src/components/fields/SelectFieldEditor/SelectFieldEditor.tsx`
- `src/components/fields/RadioFieldEditor/RadioFieldEditor.tsx`
- `src/components/fields/CheckboxFieldEditor/CheckboxFieldEditor.tsx`
- `src/components/fields/ToggleFieldEditor/ToggleFieldEditor.tsx`
- `src/components/fields/DateFieldEditor/DateFieldEditor.tsx`
- `src/components/fields/FileFieldEditor/FileFieldEditor.tsx`
- `src/components/fields/ArrayFieldEditor/ArrayFieldEditor.tsx`
- `src/components/fields/MessageFieldEditor/MessageFieldEditor.tsx`
- `src/components/fields/ConsentFieldEditor/ConsentFieldEditor.tsx`
- `src/components/layout/EditorTabs/EditorTabs.tsx`
- `src/components/layout/PageTab/PageTab.tsx`
- `src/components/layout/TabItem/TabItem.tsx`
- `src/components/plugin/FormCanvas/FormCanvas.tsx` (if using tabs for pages)

**Payload custom views** — add `forms/[id]/settings` and `forms/[id]/notifications` as collection views.

Edit `src/collections/forms.ts`:
```ts
admin: {
  components: {
    views: {
      edit: {
        default: { Component: FormCanvasView, path: '/' },
        settings: { Component: FormSettingsView, path: '/settings' },
        notifications: { Component: FormNotificationsView, path: '/notifications' },
      },
    },
  },
},
```

Create the view components in `src/form-builder/views/` (see §5 for final paths after restructure).

### 4b. `Dialog` (EditPage) → `Drawer`

**Edit:** `src/components/actions/EditPage/EditPage.tsx`

```ts
import { Drawer, useDrawer } from '@payloadcms/ui'

const { toggleDrawer, drawerSlug } = useDrawer()
// Replace <Dialog> open/onOpenChange with <Drawer slug={drawerSlug}>
```

Delete `src/components/ui/dialog.ts` once no longer referenced.

### 4c. `AlertDialog` (delete actions) → `ConfirmationModal`

**Edit:**
- `src/components/actions/DeleteField/DeleteField.tsx`
- `src/components/actions/DeletePage/DeletePage.tsx`
- `src/components/actions/DeleteRow/DeleteRow.tsx`

```ts
import { ConfirmationModal, useModal } from '@payloadcms/ui'

const { openModal, closeModal } = useModal()
// Replace <AlertDialog> with <ConfirmationModal slug="delete-field-[id]" ... />
```

Delete `src/components/ui/alert-dialog.ts` once no longer referenced.

### 4d. `Menu` (action dropdowns) → `Popup`

**Edit:**
- `src/components/layout/FormRow/FormRow.tsx`
- `src/components/fields/ArrayFieldEditor/ArrayFieldEditor.tsx`
- `src/components/notifications/EmailNotificationInput/` (if applicable)
- Any `ToolbarItem` using `DropdownMenu`

```ts
import { Popup } from '@payloadcms/ui'
// Replace <DropdownMenu>/<DropdownMenuTrigger>/<DropdownMenuContent> with <Popup>
```

Delete `src/components/ui/dropdown-menu.tsx` once no longer referenced.

**After all 4 sub-tasks:**
- Remove `@base-ui/react` from `package.json` dependencies.
- Run `pnpm tsc --noEmit`.

---

## 5. File/folder restructure

**Target layout:**
```
src/
  form-builder/          # canvas, field editors, drag-and-drop, EditPage, views
    components/
    hooks/
    views/               # FormCanvasView, FormSettingsView, FormNotificationsView
  submissions/           # endpoints, import/export UI components
    components/
    endpoints/           # move from src/endpoints/
  notifications/         # email notification components + hooks
    components/
    hooks/               # submissionNotifications.ts
  shared/                # utils, types, context, ui primitives
    utils/               # nanoid.ts, attemptAsync.ts, replaceDataPlaceholders.ts
    types.ts             # move from src/lib/types.ts
    context/             # move from src/components/context/
  collections/           # stays flat (forms.ts, submissions.ts, form-uploads.ts)
  hooks/                 # Payload lifecycle hooks — stays flat
  index.ts
  types.ts               # public-facing plugin types
  fieldSchema.ts         # stays at root (referenced by collections + form-builder)
  formTypes.ts           # stays at root
```

**Steps:**
1. Create the new directory tree.
2. Move files — use `git mv` so history is preserved.
3. Update all import paths (use find+sed or IDE refactor).
4. Update `tsconfig.json` path aliases if needed.
5. Update `src/exports/client.ts` and `src/exports/rsc.ts` re-export barrel files.
6. Run `pnpm tsc --noEmit` and `pnpm test` — both must pass.

> Do this after topics 1–4 so there are fewer files to move.

---

## 6. Replace `@atlaskit/pragmatic-drag-and-drop` with `@dnd-kit`

**Goal:** Same DnD model (rows + columns), same three drag types, `@dnd-kit` API.

`@dnd-kit/core` and `@dnd-kit/sortable` are already in the tree via `@payloadcms/ui` — no new installs needed.

### Drag type mapping

| Current (pragmatic) | dnd-kit equivalent |
|---|---|
| `draggable()` (new-field from palette) | `useDraggable` |
| `draggable()` + `dropTargetForElements()` (existing field) | `useSortable` |
| `draggable()` + `dropTargetForElements()` (row reorder) | `useSortable` on rows |
| `monitorForElements()` global monitor | `DndContext` `onDragEnd` |
| `setCustomNativeDragPreview` | `DragOverlay` |
| `DropIndicator` (left/right/top/bottom edge) | custom indicator via `over` + position |

### Files to rewrite

- `src/components/hooks/useDropMonitor/useDropMonitor.ts` → replaced by `DndContext` `onDragEnd` handler
- `src/components/hooks/useDroppableField/useDroppableField.ts` → `useDraggable` hook
- `src/components/hooks/useFieldDrop/` → merge into canvas `onDragEnd`
- `src/components/hooks/useRowReorder/` → merge into canvas `onDragEnd`
- `src/components/layout/FieldItem/FieldItem.tsx` → `useSortable`
- `src/components/layout/FormRow/FormRow.tsx` → `useSortable` for row, `useDroppable` for field target
- `src/components/plugin/FormCanvas/FormCanvas.tsx` → wrap with `DndContext`, add `DragOverlay`
- `src/components/fields/OptionsEditor/OptionsEditor.tsx` → `useSortable` for option reordering
- `src/components/fields/ArrayFieldEditor/ArrayFieldEditor.tsx` → `useSortable` for sub-field reordering

### `DndContext` shape (canvas level)

```tsx
import { DndContext, DragOverlay, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'

<DndContext
  sensors={sensors}
  onDragStart={handleDragStart}
  onDragEnd={handleDragEnd}
>
  {/* canvas rows */}
  <DragOverlay>{activeItem ? <DragPreview item={activeItem} /> : null}</DragOverlay>
</DndContext>
```

### `onDragEnd` routing (replaces `useDropMonitor`)

```ts
function handleDragEnd({ active, over }) {
  if (!over) return
  const sourceType = active.data.current?.type   // 'new-field' | 'existing-field' | 'existing-row'
  const targetType = over.data.current?.type     // 'row-target' | 'field-target' | 'new-row-target'

  if (sourceType === 'existing-row') { handleRowReorder(...); return }
  if (sourceType === 'new-field') { handleFieldDrop({ type: 'new', ... }); return }
  if (sourceType === 'existing-field') { handleFieldDrop({ type: 'existing', ... }); return }
}
```

**After rewrite:**
- Remove `@atlaskit/pragmatic-drag-and-drop`, `@atlaskit/pragmatic-drag-and-drop-hitbox`, `@atlaskit/pragmatic-drag-and-drop-react-drop-indicator` from `package.json`.
- Run `pnpm tsc --noEmit` and `pnpm test`.
- Smoke-test drag behaviour in the dev server: drag new field from palette → row, reorder fields within a row, reorder rows.

---

## Execution order

```
1. nanoid → crypto.randomUUID()        ~15 min   (1 file, trivial)
2. attemptAsync inline                  ~20 min   (14 imports, no logic change)
3. FieldRenderer / ts-pattern           ~30 min   (1 file + type audit)
4a. Field editors flat + Payload views  ~2 hr     (13 editors + 3 new view components)
4b. EditPage → Drawer                   ~30 min
4c. Delete actions → ConfirmationModal  ~30 min
4d. Menus → Popup                       ~30 min
5. File/folder restructure              ~1 hr     (git mv + import path updates)
6. DnD pragmatic → dnd-kit              ~3 hr     (largest change, test manually)
```

Total estimate: ~8 hours. Start with 1–3 (safe, isolated), do 4+5 in the middle, finish with 6 (needs manual smoke-testing).

---

## Definition of done

- `pnpm tsc --noEmit` — zero errors
- `pnpm test` — 256/256 unit tests passing
- `pnpm test:integration` — 7/7 integration tests passing
- `pnpm playwright test` — e2e smoke tests passing
- Dev server starts, form canvas loads, drag-and-drop works
- `package.json` no longer lists: `es-toolkit`, `nanoid`, `ts-pattern`, `@base-ui/react`, `@atlaskit/pragmatic-drag-and-drop`, `@atlaskit/pragmatic-drag-and-drop-hitbox`, `@atlaskit/pragmatic-drag-and-drop-react-drop-indicator`
