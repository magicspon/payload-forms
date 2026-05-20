'use client'

import { useFormPages } from '@/form-builder/hooks/useFormPages'
import { Inline } from '@/shared/layout'
import { Button, Drawer, DrawerToggler, EditIcon, useDrawerSlug, useModal } from '@payloadcms/ui'
import * as React from 'react'

import styles from './EditPage.module.css'

type TEditorPageProps = {
  pageId: string
}

export function EditPage({ pageId }: TEditorPageProps) {
  const { pages, setPages } = useFormPages()
  const { closeModal } = useModal()
  const drawerSlug = useDrawerSlug(`edit-page-${pageId}`)

  const currentPage = pages?.find((p) => p.id === pageId)

  const [title, setTitle] = React.useState(currentPage?.title ?? '')
  const [backButton, setBackButton] = React.useState(currentPage?.backButton ?? 'Back')
  const [nextButton, setNextButton] = React.useState(currentPage?.nextButton ?? 'Next')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    e.stopPropagation()
    setPages(pages.map((p) => (p.id === pageId ? { ...p, backButton, nextButton, title } : p)))
    closeModal(drawerSlug)
  }

  return (
    <>
      <DrawerToggler className={styles.iconButton} data-testid="edit-page-button" slug={drawerSlug}>
        <span className={styles.srOnly}>Edit page</span>
        <EditIcon />
      </DrawerToggler>

      <Drawer slug={drawerSlug} title="Edit page">
        <form className={styles.form} onSubmit={handleSubmit}>
          <div className="field-type text">
            <label className="field-label" htmlFor="page-title">
              Page Title
            </label>
            <input
              aria-label="Page title"
              className="field-type__input"
              id="page-title"
              onChange={(e) => setTitle(e.target.value)}
              type="text"
              value={title}
            />
          </div>

          <div className="field-type text">
            <label className="field-label" htmlFor="page-back-button">
              Back Button Label
            </label>
            <input
              aria-label="Back button label"
              className="field-type__input"
              id="page-back-button"
              onChange={(e) => setBackButton(e.target.value)}
              type="text"
              value={backButton}
            />
          </div>

          <div className="field-type text">
            <label className="field-label" htmlFor="page-next-button">
              Next Button Label
            </label>
            <input
              aria-label="Next button label"
              className="field-type__input"
              id="page-next-button"
              onChange={(e) => setNextButton(e.target.value)}
              type="text"
              value={nextButton}
            />
          </div>

          <Inline className={styles.actions}>
            <Button
              data-testid="cancel-button"
              onClick={() => closeModal(drawerSlug)}
              type="button"
            >
              Cancel
            </Button>
            <Button data-testid="save-button" type="submit">
              Save
            </Button>
          </Inline>
        </form>
      </Drawer>
    </>
  )
}
