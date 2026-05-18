'use client'

import * as React from 'react'

export type DndEdge = 'bottom' | 'left' | 'right' | 'top'

type DndIndicatorValue = {
	edge: DndEdge | null
	targetId: null | string
}

const DndIndicatorContext = React.createContext<DndIndicatorValue>({
	edge: null,
	targetId: null,
})

export function useDndIndicator() {
	return React.use(DndIndicatorContext)
}

export function DndIndicatorProvider({
	children,
	value,
}: {
	children: React.ReactNode
	value: DndIndicatorValue
}) {
	return (
		<DndIndicatorContext value={value}>
			{children}
		</DndIndicatorContext>
	)
}
