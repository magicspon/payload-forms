import { useFormPages } from '@/form-builder/hooks/useFormPages'
import { removeField } from '@/form-builder/utils/formTree'
import { ConfirmationModal, toast, useDrawerSlug, useModal, XIcon } from '@payloadcms/ui'
import * as React from 'react'

import styles from './DeleteField.module.css'

type TDeleteMenuItemProps = {
	handle: string
	id: string
}

export function DeleteField({ id }: TDeleteMenuItemProps) {
	const { pages, setPages } = useFormPages()
	const { openModal } = useModal()
	const modalSlug = useDrawerSlug(`delete-field-${id}`)

	const onConfirm = () => {
		const newPages = removeField(pages, id)
		setPages(newPages)
		toast.success('Field deleted successfully')
	}

	return (
		<>
			<button
				className={styles.iconButton}
				data-testid="delete-field-button"
				onClick={() => openModal(modalSlug)}
				type="button"
			>
				<span className="sr-only">Delete</span>
				<XIcon />
			</button>

			<ConfirmationModal
				body="This action cannot be undone."
				confirmLabel="Delete"
				heading="Delete Field"
				modalSlug={modalSlug}
				onConfirm={onConfirm}
			/>
		</>
	)
}
