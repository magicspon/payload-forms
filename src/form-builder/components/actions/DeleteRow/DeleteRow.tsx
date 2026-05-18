import { useFormPages } from '@/form-builder/hooks/useFormPages'
import { removeRow } from '@/form-builder/utils/formTree'
import { ConfirmationModal, useDrawerSlug, useModal, XIcon } from '@payloadcms/ui'
import * as React from 'react'

import styles from './DeleteRow.module.css'

type TDeleteRowProps = {
	rowId: string
	shouldWarn: boolean
}

export function DeleteRow({ rowId, shouldWarn }: TDeleteRowProps) {
	const { pages, setPages } = useFormPages()
	const { openModal } = useModal()
	const modalSlug = useDrawerSlug(`delete-row-${rowId}`)

	const onClick = () => {
		const newPages = removeRow(pages, rowId)
		setPages(newPages)
	}

	if (!shouldWarn) {
		return (
			<button
				className={styles.iconButton}
				data-testid="delete-row-button"
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
				data-testid="delete-row-button"
				onClick={() => openModal(modalSlug)}
				type="button"
			>
				<span className="sr-only">Delete</span>
				<XIcon />
			</button>

			<ConfirmationModal
				body="This action cannot be undone."
				confirmLabel="Delete"
				heading="Delete Row"
				modalSlug={modalSlug}
				onConfirm={onClick}
			/>
		</>
	)
}
