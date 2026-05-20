'use client'

import type { OptionObject } from 'payload'

import {
  Button,
  Drawer,
  DrawerToggler,
  Dropzone,
  FieldDescription,
  FieldLabel,
  Gutter,
  SelectInput,
  toast,
  useDrawerSlug,
} from '@payloadcms/ui'
import Papa from 'papaparse'
import * as React from 'react'

import type { FormOption } from './FormImportButton'

interface ImportResult {
  count?: number
  error?: string
  success: boolean
}

const BATCH_SIZE = 50

export function FormImportButtonClient({ forms }: { forms: FormOption[] }) {
  const drawerSlug = useDrawerSlug('submission-import')

  const [formId, setFormId] = React.useState('')

  const [parsedRows, setParsedRows] = React.useState<Record<string, string>[]>([])
  const [parseError, setParseError] = React.useState<null | string>(null)
  const [progress, setProgress] = React.useState<{
    done: number
    total: number
  } | null>(null)
  const [isPending, setIsPending] = React.useState(false)
  const [importError, setImportError] = React.useState<Error | null>(null)

  const formOptions: OptionObject[] = forms.map((f) => ({
    label: f.title,
    value: f.id,
  }))

  const fileInputRef = React.useRef<HTMLInputElement>(null)

  function resetImport() {
    setImportError(null)
    setProgress(null)
  }

  function parseFile(file: File) {
    setParsedRows([])
    setParseError(null)
    resetImport()

    Papa.parse<Record<string, string>>(file, {
      complete: ({ data, meta }) => {
        if (!meta.fields?.length) {
          setParseError('CSV has no header row.')
          return
        }
        setParsedRows(data)
      },
      error: (err) => setParseError(err.message),
      header: true,
      skipEmptyLines: true,
    })
  }

  function handleDrop(files: FileList) {
    const file = files[0]
    if (file) {
      parseFile(file)
    }
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) {
      parseFile(file)
    }
  }

  async function runImport() {
    setIsPending(true)
    setImportError(null)

    const batches: Record<string, string>[][] = []
    for (let i = 0; i < parsedRows.length; i += BATCH_SIZE) {
      batches.push(parsedRows.slice(i, i + BATCH_SIZE))
    }

    setProgress({ done: 0, total: batches.length })
    let totalCreated = 0

    try {
      for (let i = 0; i < batches.length; i++) {
        const res = await fetch(`/api/submissions/import-csv`, {
          body: JSON.stringify({ formId, rows: batches[i] }),
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          method: 'POST',
        })

        const json = (await res.json()) as ImportResult
        setProgress({ done: i + 1, total: batches.length })

        if (!json.success) {
          throw new Error(json.error ?? 'Import failed')
        }
        totalCreated += json.count ?? 0
      }

      toast.success(`Successfully imported ${totalCreated} submission(s).`)
      setParsedRows([])
      setProgress(null)
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Import failed. Please try again.')
      setImportError(error)
      toast.error(error.message)
    } finally {
      setIsPending(false)
    }
  }

  const canImport = Boolean(formId) && parsedRows.length > 0 && !parseError && !isPending

  return (
    <>
      <DrawerToggler
        className="btn btn--icon-style-without-border btn--size-medium btn--withoutPopup btn--style-secondary btn--withoutPopup"
        slug={drawerSlug}
      >
        Import Submissions
      </DrawerToggler>

      <Drawer slug={drawerSlug} title="Import Submissions from CSV">
        <Gutter>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '1.5rem',
              maxWidth: 560,
            }}
          >
            <SelectInput
              isClearable
              label="Form"
              name="import-form"
              onChange={(opt) => setFormId(opt ? (opt as OptionObject).value : '')}
              options={formOptions}
              path="import-form"
              placeholder="Select a form…"
              value={formId}
            />

            <div className="field-type">
              <FieldLabel label="CSV File" />
              <Dropzone disabled={!formId || isPending} onChange={handleDrop}>
                <div className="file-field__dropzoneContent">
                  <div className="file-field__dropzoneButtons">
                    <Button
                      buttonStyle="pill"
                      disabled={!formId || isPending}
                      onClick={() => fileInputRef.current?.click()}
                      size="small"
                      type="button"
                    >
                      {parsedRows.length > 0 ? 'Replace file' : 'Select file'}
                    </Button>
                    <input
                      accept=".csv,text/csv"
                      aria-hidden="true"
                      onChange={handleInputChange}
                      ref={fileInputRef}
                      style={{ display: 'none' }}
                      tabIndex={-1}
                      type="file"
                    />
                  </div>
                  {parsedRows.length > 0 && !parseError && (
                    <p style={{ fontSize: '0.875rem' }}>
                      {parsedRows.length} row(s) ready to import
                    </p>
                  )}
                  {!parsedRows.length && (
                    <p style={{ fontSize: '0.875rem' }}>or drag and drop a CSV file here</p>
                  )}
                </div>
              </Dropzone>
              <FieldDescription
                description="Upload a CSV template downloaded from the form's edit page."
                path="import-csv-file"
              />
            </div>

            {parseError && (
              <p
                style={{
                  color: 'var(--theme-error-500)',
                  fontSize: '0.875rem',
                }}
              >
                {parseError}
              </p>
            )}

            <div>
              <Button
                buttonStyle="primary"
                disabled={!canImport}
                onClick={runImport}
                size="medium"
                type="button"
              >
                {isPending
                  ? 'Importing…'
                  : `Import${parsedRows.length > 0 ? ` ${parsedRows.length}` : ''} rows`}
              </Button>
            </div>

            {progress && (
              <div>
                <p style={{ fontSize: '0.875rem', marginBottom: '0.25rem' }}>
                  Batch {progress.done} / {progress.total}
                </p>
                <div
                  style={{
                    background: 'var(--theme-elevation-100)',
                    borderRadius: 4,
                    height: 8,
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      background: 'var(--theme-success-500)',
                      height: '100%',
                      transition: 'width 0.2s ease',
                      width: `${(progress.done / progress.total) * 100}%`,
                    }}
                  />
                </div>
              </div>
            )}

            {importError && (
              <p
                style={{
                  color: 'var(--theme-error-500)',
                  fontSize: '0.875rem',
                }}
              >
                {importError.message}
              </p>
            )}
          </div>
        </Gutter>
      </Drawer>
    </>
  )
}
