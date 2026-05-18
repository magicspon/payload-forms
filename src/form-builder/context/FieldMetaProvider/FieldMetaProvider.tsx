import * as React from 'react'

export type FieldMeta = { pageId: string; rowId: string }

const Context = React.createContext<FieldMeta>(null!)

export function useFieldMeta() {
	return React.use(Context)
}

export function FieldMetaProvider({
	children,
	pageId,
	rowId,
}: { children: React.ReactNode } & FieldMeta) {
	return (
		<Context value={{ pageId, rowId }}>{children}</Context>
	)
}
