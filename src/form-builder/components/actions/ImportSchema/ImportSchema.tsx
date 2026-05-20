'use client'

import type { FormPage, FormRow } from '@/form-builder/utils/formTree'
import type { Field, FieldType } from '@/shared/fieldSchema'

import { useFormPages } from '@/form-builder/hooks/useFormPages/useFormPages'
import { fieldTypes } from '@/form-builder/utils/fieldTypes'
import { appendRowToPage, getAllFields } from '@/form-builder/utils/formTree'
import { createDefaultField } from '@/shared/fieldSchema'
import { camelCase } from '@/shared/utils/camelCase'
import { nanoid } from '@/shared/utils/nanoid'
import { Button, SelectInput, TextInput, toast } from '@payloadcms/ui'
import Papa from 'papaparse'
import * as React from 'react'

// 'message' has no name/label; 'array' requires sub-field authoring — exclude both
const importableFieldTypes = fieldTypes.filter((t) => t.value !== 'message' && t.value !== 'array')

const fieldTypeSelectOptions = [
  { label: '— skip —', value: '' },
  ...importableFieldTypes.map((t) => ({ label: t.label, value: t.value })),
]

type InsertMode = 'append' | 'new-page' | 'replace'

interface Option {
  label: string
  value: string
}

interface Mapping {
  fieldType: FieldType | null
  header: string
  /** Editable field name (camelCase of header by default) */
  name: string
  /** Only populated when fieldType is checkbox, radio, or select */
  options: Option[]
}

const OPTIONS_TYPES = new Set<FieldType>(['checkbox', 'radio', 'select'])

function isOptionsType(t: FieldType | null): t is 'checkbox' | 'radio' | 'select' {
  return t !== null && OPTIONS_TYPES.has(t)
}

/** Guess a sensible default field type from a column header name. */
function inferFieldType(header: string): FieldType {
  const h = header.toLowerCase()
  if (h.includes('email')) {
    return 'email'
  }
  if (h.includes('date')) {
    return 'date'
  }
  if (
    h.includes('number') ||
    h.includes('age') ||
    h.includes('count') ||
    h.includes('amount') ||
    h.includes('score')
  ) {
    return 'number'
  }
  if (h.includes('consent') || h.includes('agree') || h.includes('accept')) {
    return 'consent'
  }
  if (h.includes('toggle') || h.includes('enabled') || h.includes('active')) {
    return 'toggle'
  }
  return 'text'
}

/** Returns a map of index → error message for active mappings with name conflicts. */
function computeNameErrors(mappings: Mapping[], existingNames: Set<string>): Map<number, string> {
  const errors = new Map<number, string>()
  const seen = new Map<string, number>() // name → first active index

  for (let i = 0; i < mappings.length; i++) {
    const m = mappings[i]
    if (m.fieldType === null) {
      continue
    } // skipped rows don't participate
    const n = m.name.trim()
    if (!n) {
      errors.set(i, 'Name is required')
      continue
    }
    if (existingNames.has(n)) {
      errors.set(i, `"${n}" already exists in the form`)
      continue
    }
    const prev = seen.get(n)
    if (prev !== undefined) {
      errors.set(prev, `"${n}" is used more than once`)
      errors.set(i, `"${n}" is used more than once`)
    } else {
      seen.set(n, i)
    }
  }
  return errors
}

export function ImportSchema() {
  const { pages, setPages } = useFormPages()

  const [mappings, setMappings] = React.useState<Mapping[]>([])
  const [insertMode, setInsertMode] = React.useState<InsertMode>('replace')
  const [targetPageId, setTargetPageId] = React.useState<string>('')
  const [newPageTitle, setNewPageTitle] = React.useState('')
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  React.useEffect(() => {
    if (insertMode === 'append' && !targetPageId && pages.length > 0) {
      setTargetPageId(pages[0]?.id ?? '')
    }
  }, [insertMode, pages, targetPageId])

  function handleFile(file: File) {
    Papa.parse(file, {
      complete: ({ meta }) => {
        const headers = meta.fields ?? []
        if (headers.length === 0) {
          toast.error('No column headers found in this CSV.')
          return
        }
        setMappings(
          headers.map<Mapping>((h) => {
            const fieldType = inferFieldType(h)
            return {
              name: camelCase(h),
              fieldType,
              header: h,
              options: isOptionsType(fieldType) ? [{ label: '', value: '' }] : [],
            }
          }),
        )
      },
      error: (err) => {
        toast.error(`Could not parse CSV: ${err.message}`)
      },
      header: true,
      preview: 1,
    })
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) {
      handleFile(file)
    }
    e.target.value = ''
  }

  function setMappingType(index: number, fieldType: FieldType | null) {
    setMappings((prev) => {
      const next = [...prev]
      const current = next[index]
      // Preserve existing options when staying in the options-type group; reset otherwise
      const options = isOptionsType(fieldType)
        ? isOptionsType(current.fieldType)
          ? current.options
          : [{ label: '', value: '' }]
        : []
      next[index] = { ...current, fieldType, options }
      return next
    })
  }

  function setMappingName(index: number, name: string) {
    setMappings((prev) => {
      const next = [...prev]
      next[index] = { ...next[index], name }
      return next
    })
  }

  function setMappingOptions(index: number, options: Option[]) {
    setMappings((prev) => {
      const next = [...prev]
      next[index] = { ...next[index], options }
      return next
    })
  }

  /** Names of fields already present in the form (empty when replacing). */
  const existingNames = React.useMemo<Set<string>>(() => {
    if (insertMode === 'replace') {
      return new Set()
    }
    return new Set(
      getAllFields(pages)
        .filter((f) => 'name' in f)
        .map((f) => f.name),
    )
  }, [insertMode, pages])

  const nameErrors = React.useMemo(
    () => computeNameErrors(mappings, existingNames),
    [mappings, existingNames],
  )

  const pageSelectOptions = React.useMemo(
    () => pages.map((p) => ({ label: p.title || 'Untitled page', value: p.id })),
    [pages],
  )

  function handleGenerate() {
    const active = mappings.filter((m) => m.fieldType !== null)
    if (active.length === 0) {
      return
    }
    if (nameErrors.size > 0) {
      return
    } // guard — button is disabled, but be safe

    const newFields: Field[] = active.map((m) => {
      const base = createDefaultField(nanoid(), m.fieldType!)
      const validOptions = m.options.filter((o) => o.label.trim())
      const field = {
        ...base,
        name: m.name.trim(),
        _draft: false,
        label: m.header,
      }
      if (isOptionsType(m.fieldType) && validOptions.length > 0) {
        Object.assign(field, { options: validOptions })
      }
      return field as Field
    })

    const newRows: FormRow[] = newFields.map((f) => ({
      id: nanoid(),
      columns: [f],
    }))

    if (insertMode === 'replace') {
      const page: FormPage = {
        id: nanoid(),
        backButton: 'Back',
        nextButton: 'Next',
        rows: newRows,
        title: 'Page 1',
      }
      setPages([page])
    } else if (insertMode === 'append') {
      const pageId = targetPageId || pages[0]?.id || ''
      if (!pageId) {
        toast.error('No page available to append to.')
        return
      }
      let updated = pages
      for (const row of newRows) {
        updated = appendRowToPage(updated, pageId, row)
      }
      setPages(updated)
    } else {
      const page: FormPage = {
        id: nanoid(),
        backButton: 'Back',
        nextButton: 'Next',
        rows: newRows,
        title: newPageTitle.trim() || 'Imported Fields',
      }
      setPages([...pages, page])
    }

    setMappings([])
    setNewPageTitle('')
    toast.success(
      `${newFields.length} field${newFields.length === 1 ? '' : 's'} added to the form.`,
    )
  }

  const hasActiveMapping = mappings.some((m) => m.fieldType !== null)
  const hasMappings = mappings.length > 0
  const canGenerate = hasActiveMapping && nameErrors.size === 0

  return (
    <div className="import-schema">
      {/* ── Upload ── */}
      <div className="import-schema__upload">
        <p className="import-schema__label">
          Upload a CSV file to generate fields from its column headers.
        </p>
        <input
          accept=".csv"
          aria-label="Upload CSV file"
          onChange={handleFileChange}
          ref={fileInputRef}
          style={{ display: 'none' }}
          type="file"
        />
        <Button buttonStyle="secondary" onClick={() => fileInputRef.current?.click()}>
          {hasMappings ? 'Replace CSV' : 'Choose CSV'}
        </Button>
      </div>

      {/* ── Mapping table ── */}
      {hasMappings && (
        <div className="import-schema__mappings">
          <table className="import-schema__table">
            <thead>
              <tr>
                <th>Column</th>
                <th>Field name</th>
                <th>Field type</th>
              </tr>
            </thead>
            <tbody>
              {mappings.map((m, i) => (
                <React.Fragment key={m.header}>
                  <tr>
                    <td className="import-schema__header-cell">
                      <code>{m.header}</code>
                    </td>
                    <td className="import-schema__name-cell">
                      <TextInput
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setMappingName(i, e.target.value)
                        }
                        path={`mapping-name-${i}`}
                        readOnly={m.fieldType === null}
                        showError={nameErrors.has(i)}
                        value={m.name}
                      />
                      {nameErrors.has(i) && (
                        <p className="import-schema__name-error" role="alert">
                          {nameErrors.get(i)}
                        </p>
                      )}
                    </td>
                    <td className="import-schema__type-cell">
                      <SelectInput
                        name={`mapping-type-${i}`}
                        onChange={(option) => {
                          const val = option ? (option as { value: string }).value : ''
                          setMappingType(i, (val as FieldType) || null)
                        }}
                        options={fieldTypeSelectOptions}
                        path={`mapping-type-${i}`}
                        value={m.fieldType ?? ''}
                      />
                    </td>
                  </tr>

                  {/* ── Options editor (checkbox / radio / select) ── */}
                  {isOptionsType(m.fieldType) && (
                    <tr aria-label="Field options">
                      <td className="import-schema__options-cell" colSpan={3}>
                        <div className="import-schema__options">
                          <p className="import-schema__options-label">Options</p>
                          {m.options.map((opt, oi) => (
                            <div className="import-schema__option-row" key={oi}>
                              <TextInput
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                  const next = [...m.options]
                                  next[oi] = {
                                    // Auto-fill value from label when value is still empty
                                    label: e.target.value,
                                    value: next[oi].value || camelCase(e.target.value),
                                  }
                                  setMappingOptions(i, next)
                                }}
                                path={`option-label-${i}-${oi}`}
                                placeholder="Label"
                                value={opt.label}
                              />
                              <TextInput
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                  const next = [...m.options]
                                  next[oi] = {
                                    ...next[oi],
                                    value: e.target.value,
                                  }
                                  setMappingOptions(i, next)
                                }}
                                path={`option-value-${i}-${oi}`}
                                placeholder="Value"
                                value={opt.value}
                              />
                              <Button
                                buttonStyle="icon-label"
                                disabled={m.options.length === 1}
                                icon="x"
                                onClick={() =>
                                  setMappingOptions(
                                    i,
                                    m.options.filter((_, j) => j !== oi),
                                  )
                                }
                              />
                            </div>
                          ))}
                          <Button
                            buttonStyle="secondary"
                            onClick={() =>
                              setMappingOptions(i, [...m.options, { label: '', value: '' }])
                            }
                            size="small"
                          >
                            + Add option
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Insert mode ── */}
      {hasMappings && (
        <div className="import-schema__insert-mode">
          <p className="import-schema__label">Where should the fields be added?</p>

          <label className="import-schema__radio">
            <input
              aria-label="Replace all fields"
              checked={insertMode === 'replace'}
              name="insertMode"
              onChange={() => setInsertMode('replace')}
              type="radio"
              value="replace"
            />
            Replace all fields
          </label>

          <label className="import-schema__radio">
            <input
              aria-label="Append to existing page"
              checked={insertMode === 'append'}
              name="insertMode"
              onChange={() => {
                setInsertMode('append')
                if (!targetPageId && pages[0]) {
                  setTargetPageId(pages[0].id)
                }
              }}
              type="radio"
              value="append"
            />
            Append to existing page
          </label>

          {insertMode === 'append' && (
            <SelectInput
              name="targetPage"
              onChange={(option) => {
                const val = option ? (option as { value: string }).value : ''
                setTargetPageId(val)
              }}
              options={pageSelectOptions}
              path="targetPage"
              value={targetPageId}
            />
          )}

          <label className="import-schema__radio">
            <input
              aria-label="Add to new page"
              checked={insertMode === 'new-page'}
              name="insertMode"
              onChange={() => setInsertMode('new-page')}
              type="radio"
              value="new-page"
            />
            Add to new page
          </label>

          {insertMode === 'new-page' && (
            <TextInput
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewPageTitle(e.target.value)}
              path="newPageTitle"
              placeholder="Page title (optional)"
              value={newPageTitle}
            />
          )}
        </div>
      )}

      {/* ── Generate ── */}
      {hasMappings && (
        <div className="import-schema__actions">
          <Button disabled={!canGenerate} onClick={handleGenerate}>
            Generate fields
          </Button>
        </div>
      )}
    </div>
  )
}
