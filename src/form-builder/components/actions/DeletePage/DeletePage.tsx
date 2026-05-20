import { useFormPages } from '@/form-builder/hooks/useFormPages'
import { removePage } from '@/form-builder/utils/formTree'
import { ConfirmationModal, useDrawerSlug, useModal, XIcon } from '@payloadcms/ui'
import * as React from 'react'

import styles from './DeletePage.module.css'

type TDeletePageProps = {
  onDelete: () => void
  pageId: string
  shouldWarn?: boolean
}

export function DeletePage({ onDelete, pageId, shouldWarn }: TDeletePageProps) {
  const { pages, setPages } = useFormPages()
  const { openModal } = useModal()
  const modalSlug = useDrawerSlug(`delete-page-${pageId}`)

  const onClick = () => {
    const newPages = removePage(pages, pageId)
    setPages(newPages)
    onDelete()
  }

  if (!shouldWarn) {
    return (
      <button
        className={styles.iconButton}
        data-testid="delete-page-button"
        onClick={onClick}
        type="button"
      >
        <span className="sr-only">Delete</span>
        <XIcon />
      </button>
    )
  }

  return (
    <>
      <button
        className={styles.iconButton}
        data-testid="delete-page-button"
        onClick={() => openModal(modalSlug)}
        type="button"
      >
        <span className="sr-only">Delete</span>
        <XIcon />
      </button>

      <ConfirmationModal
        body="This action cannot be undone."
        confirmLabel="Delete"
        heading="Delete Page"
        modalSlug={modalSlug}
        onConfirm={onClick}
      />
    </>
  )
}
