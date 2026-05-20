'use client'

import type { TRowReorderParams } from '@/form-builder/hooks/useRowReorder'
import type { FormPage } from '@/form-builder/utils/formTree'

import { FieldMetaProvider } from '@/form-builder/context/FieldMetaProvider'
import { useFormFields } from '@/form-builder/context/FormFieldsContext'
import { useFieldDrop } from '@/form-builder/hooks/useFieldDrop'
import { useDropMonitor } from '@/form-builder/hooks/useDropMonitor/useDropMonitor'
import { useFormPages } from '@/form-builder/hooks/useFormPages'
import { useRowReorder } from '@/form-builder/hooks/useRowReorder'
import { FieldRenderer } from '@/form-builder/components/shared/FieldRenderer'
import { Inline, Stack } from '@/shared/layout'
import { nanoid } from '@/shared/utils/nanoid'
import { Button, Drawer, PlusIcon, useField, useModal } from '@payloadcms/ui'
import cx from 'clsx'
import * as React from 'react'

import { DeletePage } from '../../actions/DeletePage'
import { EditPage } from '../../actions/EditPage'
import { PageTab } from '../PageTab'
import { TabItem } from '../TabItem'
import styles from './FormCanvas.module.css'

// ─── Utilities ────────────────────────────────────────────────────────────────

function arrayMove<T>(arr: T[], from: number, to: number): T[] {
  const result = [...arr]
  const [item] = result.splice(from, 1)
  result.splice(to, 0, item)
  return result
}

// ─── Inner canvas — registers the drop monitor and owns the editor drawer ─────

type FormCanvasInnerProps = {
  children: React.ReactNode
  onCrossPageDrop?: (targetPageId: string) => void
}

function FormCanvasInner({ children, onCrossPageDrop }: FormCanvasInnerProps) {
  const handleFieldDrop = useFieldDrop()
  const handleRowReorderBase = useRowReorder()
  const { clearSelectedField, editorDrawerSlug, selectedField, selectedFieldMeta } = useFormFields()
  const { modalState } = useModal()
  const isEditorOpen = !!modalState[editorDrawerSlug]?.isOpen

  React.useEffect(() => {
    if (!isEditorOpen && selectedField) {
      clearSelectedField()
    }
  }, [isEditorOpen, clearSelectedField, selectedField])

  const handleRowReorder = React.useCallback(
    (params: TRowReorderParams) => {
      const targetPageId = handleRowReorderBase(params)
      if (targetPageId) {
        onCrossPageDrop?.(targetPageId)
      }
    },
    [handleRowReorderBase, onCrossPageDrop],
  )

  useDropMonitor({ handleFieldDrop, handleRowReorder })

  const editorDrawerTitle = selectedField
    ? 'label' in selectedField
      ? (selectedField.label ?? selectedField.type)
      : selectedField.type
    : 'Edit field'

  return (
    <>
      {children}
      <Drawer slug={editorDrawerSlug} title={editorDrawerTitle}>
        {selectedFieldMeta && (
          <FieldMetaProvider pageId={selectedFieldMeta.pageId} rowId={selectedFieldMeta.rowId}>
            <FieldRenderer {...selectedFieldMeta.field} />
          </FieldMetaProvider>
        )}
      </Drawer>
    </>
  )
}

// ─── Multi-page layout ────────────────────────────────────────────────────────

type MultipageProps = {
  activeTab: string | undefined
  setActiveTab: (id: string) => void
}

function Multipage({ activeTab, setActiveTab }: MultipageProps) {
  const { pages, setPages } = useFormPages()
  const { value: locked } = useField<boolean>({ path: 'locked' })

  React.useEffect(() => {
    if (!activeTab && pages?.[0]?.id) {
      setActiveTab(pages[0].id)
    }
  }, [activeTab, pages, setActiveTab])

  function handleTabReorder(fromIndex: number, toIndex: number) {
    setPages(arrayMove(pages, fromIndex, toIndex))
  }

  return (
    <Stack className={styles.multipage} data-testid="form-canvas">
      <div className={styles.pagesLayout}>
        <Inline className={styles.tabsRow}>
          <div aria-label="Select form page" className={styles.tabList} role="tablist">
            {pages?.map((page, index) => (
              <TabItem
                count={pages.length}
                disabled={!!locked}
                id={page.id}
                index={index}
                key={page.id}
                onHoverDrag={locked ? undefined : setActiveTab}
                onReorder={locked ? undefined : handleTabReorder}
                tab={activeTab!}
                title={page.title ?? ''}
              >
                <Button
                  aria-selected={page.id === activeTab}
                  buttonStyle={page.id === activeTab ? 'primary' : 'subtle'}
                  className={styles.m0}
                  el="button"
                  key="btn"
                  onClick={() => setActiveTab(page.id)}
                >
                  {page.title}
                </Button>

                {!locked && pages.length > 1 && page.id === activeTab && (
                  <DeletePage
                    key="delete"
                    onDelete={() => {
                      setActiveTab(pages?.[0]?.id ?? '')
                    }}
                    pageId={page.id}
                  />
                )}
                {page.id === activeTab && !locked && (
                  <EditPage key={`${page.id}:edit`} pageId={page.id} />
                )}
              </TabItem>
            ))}
          </div>
          {!locked && (
            <Button
              className={styles.mlAuto}
              onClick={() => {
                setPages([
                  ...pages,
                  {
                    id: nanoid(),
                    backButton: 'Back',
                    nextButton: 'Next',
                    rows: [{ id: nanoid(), columns: [] }],
                    title: `Page ${pages.length + 1}`,
                  } as FormPage,
                ])
              }}
              type="button"
            >
              <PlusIcon /> Add page
            </Button>
          )}
        </Inline>

        {pages?.map((page) => (
          <div
            className={cx({ [styles.hidden]: page.id !== activeTab })}
            key={page.id}
            role="tabpanel"
          >
            <PageTab pageId={page.id} rows={page.rows} />
          </div>
        ))}
      </div>
    </Stack>
  )
}

function SinglePage() {
  const { pages } = useFormPages()
  const [page] = pages

  if (!page) {
    return null
  }

  return <PageTab pageId={page.id} rows={page.rows} />
}

// ─── Public export ────────────────────────────────────────────────────────────

export function FormCanvas({ multipage = true }: { multipage?: boolean }) {
  const [activeTab, setActiveTab] = React.useState<string | undefined>()

  return (
    <FormCanvasInner onCrossPageDrop={setActiveTab}>
      {multipage ? <Multipage activeTab={activeTab} setActiveTab={setActiveTab} /> : <SinglePage />}
    </FormCanvasInner>
  )
}
