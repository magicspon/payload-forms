'use client'

import type { FieldType } from '@/shared/fieldSchema'

import { Gutter, Pagination } from '@payloadcms/ui'
import * as React from 'react'

import { formatCellValue } from './formatCellValue'
import styles from './SubmissionsView.module.css'

export type ColumnDef = {
  key: string
  label: string
  type: FieldType
}

export type SubmissionRow = {
  createdAt: string
  id: number | string
  submissionData: Record<string, unknown> | null
}

type Props = {
  columns: ColumnDef[]
  formTitle: string
  hasNextPage: boolean
  hasPrevPage: boolean
  page: number
  rows: SubmissionRow[]
  totalPages: number
}

function Badge({ children }: { children: React.ReactNode }) {
  return <span className={styles.badge}>{children}</span>
}

function renderCell(value: unknown, type: FieldType): React.ReactNode {
  const display = formatCellValue(value, type)
  switch (display.kind) {
    case 'badge':
      return <Badge>{display.text}</Badge>
    case 'text':
      return display.text
    default:
      return display.value as string
  }
}

function goToSubmission(id: number | string) {
  window.location.href = `/admin/collections/submissions/${id}`
}

function goToPage(page: number) {
  const url = new URL(window.location.href)
  url.searchParams.set('page', String(page))
  window.location.href = url.toString()
}

export function SubmissionsViewClient({
  columns,
  formTitle,
  hasNextPage,
  hasPrevPage,
  page,
  rows,
  totalPages,
}: Props) {
  return (
    <Gutter>
      <h1 className={styles.heading}>Submissions — {formTitle}</h1>

      {rows.length === 0 ? (
        <p className={styles.empty}>No submissions yet.</p>
      ) : (
        <>
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead className={styles.thead}>
                <tr>
                  <th className={styles.th}>Submitted</th>
                  {columns.map((col) => (
                    <th key={col.key} className={styles.th}>
                      {col.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => {
                  const data = row.submissionData ?? {}
                  return (
                    <tr key={row.id} className={styles.tr} onClick={() => goToSubmission(row.id)}>
                      <td className={styles.td}>{new Date(row.createdAt).toLocaleString()}</td>
                      {columns.map((col) => (
                        <td key={col.key} className={styles.td}>
                          {renderCell(data[col.key], col.type)}
                        </td>
                      ))}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className={styles.pagination}>
              <Pagination
                hasNextPage={hasNextPage}
                hasPrevPage={hasPrevPage}
                onChange={goToPage}
                page={page}
                totalPages={totalPages}
              />
            </div>
          )}
        </>
      )}
    </Gutter>
  )
}
