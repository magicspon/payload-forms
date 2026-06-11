import type { AdminViewServerProps } from 'payload'

import type { FormPage } from '@/form-builder/utils/formTree'

import type { SubmissionRow } from './SubmissionsView.client'
import { SubmissionsViewClient } from './SubmissionsView.client'
import { deriveColumns, parsePageParam, resolveFormId } from './submissionsView.utils'

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
  const page = parsePageParam(url?.searchParams.get('page') ?? null)

  const formId = resolveFormId({
    docID,
    initDocID: initPageResult.docID,
    pathname: url?.pathname ?? '',
    segments: (props.params?.segments as string[] | undefined) ?? [],
  })

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

  const columns = deriveColumns(form.pages ?? [])

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
