'use client'
import { useState } from 'react'

export function useFormPagination() {
	const [currentPage, setCurrentPage] = useState(0)

	return {
		currentPage,
		setCurrentPage,
		next: () => setCurrentPage((p) => p + 1),
		prev: () => setCurrentPage((p) => p - 1),
	}
}
