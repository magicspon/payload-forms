import type { Form, Team } from '@/shared/types'
import type { BeforeListServerProps } from 'payload'

import { FormImportButtonClient } from './FormImportButton.client'

export type TeamData = {
	forms: Array<{ id: string; title: string }>
	id: string
	name: string
}

/**
 * Server component registered as a submissions list action.
 * Fetches all teams accessible to the current user with their forms, then
 * passes the serialisable result to the client component.
 */
export async function FormImportButton({ payload }: BeforeListServerProps) {
	const result = await payload.find({
		collection: 'teams',
		depth: 1,
		pagination: false,
		populate: {
			forms: {
				title: true,
			},
		},
		select: {
			name: true,
			forms: true,
		},
	})

	const teams: TeamData[] = result.docs
		.filter((team) => (team as unknown as { forms?: { docs?: unknown[] } }).forms?.docs?.length)
		.map((team) => {
			const t = team as unknown as { forms?: { docs?: Array<Form | string> } } & Team
			return {
				id: t.id,
				name: t.name ?? '',
				forms: (t.forms?.docs ?? []).flatMap((f: Form | string) =>
					typeof f === 'string' ? [] : [{ id: f.id, title: f.title ?? '' }],
				),
			}
		})

	if (!teams.length) {return null}

	return <FormImportButtonClient teams={teams} />
}
