'use client'

import type { FieldType } from '@/shared/fieldSchema'

import { Gutter, Pagination } from '@payloadcms/ui'
import * as React from 'react'

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
  if (value === undefined || value === null) return '—'

  switch (type) {
    case 'array': {
      const count = Array.isArray(value) ? value.length : 0
      return (
        <Badge>
          {count} {count === 1 ? 'item' : 'items'}
        </Badge>
      )
    }
    case 'group':
      return <Badge>Group</Badge>
    case 'file': {
      if (Array.isArray(value)) {
        const count = value.length
        return (
          <Badge>
            {count} {count === 1 ? 'file' : 'files'}
          </Badge>
        )
      }
      if (typeof value === 'object' && value !== null) {
        const filename = (value as Record<string, unknown>).filename as string
        return filename ? filename : <Badge>1 file</Badge>
      }
      return '—'
    }
    case 'toggle':
    case 'consent':
      return value ? 'Yes' : 'No'
    case 'checkbox':
      return Array.isArray(value) ? value.join(', ') || '—' : '—'
    default:
      return value as string
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
