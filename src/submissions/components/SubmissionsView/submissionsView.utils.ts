import type { FormPage } from '@/form-builder/utils/formTree'
import type { ColumnDef } from './SubmissionsView.client'

import { getAllFields } from '@/form-builder/utils/formTree'
import { camelCase } from '@/shared/utils/camelCase'

/** Clamp the `page` query param to a positive integer, defaulting to 1. */
export function parsePageParam(raw: null | string): number {
  return Math.max(1, Number(raw ?? '1'))
}

/**
 * Resolve the form id for a custom submissions sub-view. `docID` is not reliably
 * injected, so try in order:
 *   1. the Next.js catch-all `segments` (…/forms/<id>/submissions)
 *   2. parsing the URL pathname the same way
 *   3. the direct `docID` / `initDocID` props
 */
export function resolveFormId(args: {
  docID?: number | string
  initDocID?: number | string
  pathname: string
  segments: string[]
}): number | string | undefined {
  const { docID, initDocID, pathname, segments } = args

  const idxInSegments = segments.lastIndexOf('submissions')
  if (idxInSegments > 0) {
    return segments[idxInSegments - 1]
  }

  const parts = pathname.split('/').filter(Boolean)
  const idx = parts.lastIndexOf('submissions')
  if (idx > 0) {
    return parts[idx - 1]
  }

  return docID ?? initDocID
}

/** Build the table column definitions from a form's visible, non-message fields. */
export function deriveColumns(pages: FormPage[]): ColumnDef[] {
  return getAllFields(pages)
    .filter((f): f is Exclude<typeof f, { type: 'message' }> => f.type !== 'message' && !f.hidden)
    .map((f) => ({
      key: camelCase(f.name),
      label: f.label,
      type: f.type,
    }))
}
