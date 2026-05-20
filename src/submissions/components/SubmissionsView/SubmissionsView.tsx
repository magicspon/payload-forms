import type { AdminViewServerProps } from 'payload'

import { getAllFields } from '@/form-builder/utils/formTree'
import type { FormPage } from '@/form-builder/utils/formTree'
import { camelCase } from '@/shared/utils/camelCase'

import type { ColumnDef, SubmissionRow } from './SubmissionsView.client'
import { SubmissionsViewClient } from './SubmissionsView.client'

type Props = AdminViewServerProps & { submissionsSlug?: string }

type FormResult = {
  id: number | string
  pages: FormPage[] | null
  title: string | null
}

type SubmissionDoc = {
  createdAt: string
  id: number | string
  submissionData: Record<string, unknown> | null
}

const LIMIT = 20

export async function SubmissionsView(props: Props) {
  const { docID, initPageResult, submissionsSlug = 'submissions' } = props
  const { req } = initPageResult
  const { payload } = req
  const formsSlug = initPageResult.collectionConfig?.slug ?? 'forms'

  const rawUrl = req.url ?? ''
  const url = rawUrl ? new URL(rawUrl) : null
  const page = Math.max(1, Number(url?.searchParams.get('page') ?? '1'))

  // docID is not reliably injected for custom sub-views. Try in order:
  // 1. params.segments from the Next.js catch-all route: ['collections','forms','2','submissions']
  // 2. URL path parsing as a fallback
  // 3. direct docID / initPageResult.docID props
  const segments = (props.params?.segments as string[] | undefined) ?? []
  const submissionsIdxInSegments = segments.lastIndexOf('submissions')
  const formId: number | string | undefined =
    submissionsIdxInSegments > 0
      ? segments[submissionsIdxInSegments - 1]
      : (() => {
          const parts = (url?.pathname ?? '').split('/').filter(Boolean)
          const idx = parts.lastIndexOf('submissions')
          return idx > 0 ? parts[idx - 1] : (docID ?? initPageResult.docID)
        })()

  if (!formId) {
    return <p>Form not found.</p>
  }

  const [form, submissionsResult] = await Promise.all([
    payload.findByID({
      collection: formsSlug as 'forms',
      id: formId,
      depth: 0,
      select: { title: true, pages: true },
    }) as Promise<FormResult>,
    payload.find({
      collection: submissionsSlug as 'submissions',
      depth: 0,
      limit: LIMIT,
      page,
      select: { createdAt: true, submissionData: true },
      where: { form: { equals: formId } },
    }) as Promise<{
      docs: SubmissionDoc[]
      hasNextPage: boolean
      hasPrevPage: boolean
      page: number
      totalPages: number
    }>,
  ])

  const pages = form.pages ?? []
  const nonMessageFields = getAllFields(pages).filter(
    (f): f is Exclude<typeof f, { type: 'message' }> => f.type !== 'message' && !f.hidden,
  )

  const columns: ColumnDef[] = nonMessageFields.map((f) => ({
    key: camelCase(f.name),
    label: f.label,
    type: f.type,
  }))

  const rows: SubmissionRow[] = submissionsResult.docs.map((doc) => ({
    createdAt: doc.createdAt,
    id: doc.id,
    submissionData: doc.submissionData,
  }))

  return (
    <SubmissionsViewClient
      columns={columns}
      formTitle={form.title ?? ''}
      hasNextPage={submissionsResult.hasNextPage}
      hasPrevPage={submissionsResult.hasPrevPage}
      page={submissionsResult.page ?? page}
      rows={rows}
      totalPages={submissionsResult.totalPages}
    />
  )
}
