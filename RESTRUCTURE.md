# Source Restructure Plan

Goals: eliminate duplicate/misplaced files, group by feature scope, make the tree navigable.

---

## 1. Move `fieldSchema` to shared

`fieldSchema` is consumed by collections, submissions, notifications, hooks, and form-builder components — it is not form-builder-specific.

- `src/form-builder/fieldSchema.ts` → `src/shared/fieldSchema.ts`
- Delete `src/fieldSchema.ts` (root re-export barrel)
- Update all imports from `@/fieldSchema`, `../fieldSchema`, `../../fieldSchema`, `../../../fieldSchema` → `@/shared/fieldSchema`

---

## 2. Delete `src/utils/` entirely

### 2a. Delete re-export barrels (callers update to import from `form-builder/utils/` directly)

| File | Action |
|---|---|
| `src/utils/buildFormSchema.ts` | Delete. Callers → `@/form-builder/utils/buildFormSchema` |
| `src/utils/formTree.ts` | Delete. Callers → `@/form-builder/utils/formTree` |
| `src/utils/fieldTypes.ts` | Delete. Callers → `@/form-builder/utils/fieldTypes` |

### 2b. Move standalone utils to feature directories (tests move with files)

| File | Destination |
|---|---|
| `src/utils/notifications.ts` + `.test.ts` | `src/notifications/utils/` |
| `src/utils/errorResponse.ts` | `src/submissions/utils/` |
| `src/utils/csvTemplateUtils.ts` + `.test.ts` | `src/submissions/utils/` |
| `src/utils/fileUpload.ts` | `src/submissions/utils/` |
| `src/utils/mergeCollection.ts` + `.test.ts` | `src/shared/utils/` |
| `src/utils/mergePages.ts` + `.test.ts` | `src/shared/utils/` |

Delete `src/utils/` directory once empty.

---

## 3. Split `form-builder/components/plugin/`

`plugin/` is a misleading name. Split its three components by where they actually belong:

| Component | Destination |
|---|---|
| `FormCanvas/` | `src/form-builder/components/canvas/` |
| `ImportSchema/` | `src/form-builder/components/actions/` |
| `EmailFieldSelect/` | `src/notifications/components/` |

Delete `src/form-builder/components/plugin/` once empty.

---

## 4. Separate shared helpers from field editors

`src/form-builder/components/fields/` mixes actual field editors with shared helpers. Move the helpers to a dedicated directory:

Move to `src/form-builder/components/shared/`:
- `FieldPalette/`
- `FieldRenderer/`
- `SharedFields/`
- `ConditionEditor/`
- `OptionsEditor/`

The thirteen field editors (`TextFieldEditor`, `EmailFieldEditor`, etc.) stay in `fields/`.

---

## 5. Give `BeforeDashboard` a subdirectory

| File | Destination |
|---|---|
| `BeforeDashboardClient.tsx` + `.module.css` | `src/form-builder/components/dashboard/` |
| `BeforeDashboardServer.tsx` + `.module.css` | `src/form-builder/components/dashboard/` |

---

## 6. Flatten `src/shared/ui/`

Single-file directory — flatten it:

- `src/shared/ui/layout.tsx` → `src/shared/layout.tsx`
- `src/shared/ui/layout.module.css` → `src/shared/layout.module.css`
- Delete `src/shared/ui/` directory

---

## No changes to

- `src/form-builder/hooks/` — stays flat (7 hooks, naming is clear)
- `src/form-builder/utils/` — stays as-is (`buildFormSchema`, `formTree`, `fieldTypes`, `safeClosestCenter`)
- `src/form-builder/components/layout/` — stays as-is
- `src/form-builder/components/actions/` — stays as-is (gains `ImportSchema`)
- `src/form-builder/components/lexical/` — stays as-is
- `src/collections/` — stays flat
- `src/notifications/` — stays as-is (gains `EmailFieldSelect` + `notifications` utils)
- `src/submissions/` — stays as-is (gains `errorResponse`, `csvTemplateUtils`, `fileUpload` utils)
- `src/types.ts`, `src/formTypes.ts` — stay at root
- `src/exports/` — stays as-is (import paths updated after moves)
- `tsconfig.json` — no changes (`@/*` → `./src/*` covers all new paths)

---

## Build note (separate task)

SWC does not resolve `@/*` path aliases in compiled output, and `tsc` does not rewrite them in `.d.ts` files. This is a pre-existing issue unrelated to this restructure.

**Recommended fix:** add `tsc-alias` as a post-build step to rewrite aliases to relative paths in both `.js` and `.d.ts` output. Future upgrade: migrate to `tsup` which handles this natively.

---

## Execution order

1. `fieldSchema` move (most cross-cutting — do first so subsequent moves import from the right place)
2. `src/utils/` cleanup (isolated, no component changes)
3. `shared/ui/` flatten (small, isolated)
4. `BeforeDashboard` subdirectory (trivial)
5. `form-builder/components/shared/` — pull out shared helpers
6. `form-builder/components/plugin/` — split into canvas/, actions/, notifications/
7. Update all barrel files (`src/exports/client.ts`, `src/exports/rsc.ts`, `src/form-builder/index.ts`)
8. `pnpm tsc --noEmit` — zero errors
9. `pnpm test` — all unit tests passing

---

## Definition of done

- `pnpm tsc --noEmit` — zero errors
- `pnpm test` — all unit tests passing
- No file imports from `@/utils/*` or `../utils/*`
- No file imports from `@/fieldSchema` or `../fieldSchema` (root barrel gone)
- `src/utils/` directory does not exist
- `src/form-builder/components/plugin/` directory does not exist
- `src/shared/ui/` directory does not exist
