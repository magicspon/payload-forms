import type { Team, TeamMember, User } from '@/shared/types'
import type { CollectionBeforeChangeHook } from 'payload'

import { attemptAsync } from '@/shared/utils/attemptAsync'
import { replaceTemplatePlaceholders } from '@/shared/utils/replaceDataPlaceholders'
import { convertLexicalToHTML } from '@payloadcms/richtext-lexical/html'
import { convertLexicalToPlaintext } from '@payloadcms/richtext-lexical/plaintext'
import { z } from 'zod'

import type { CollectionSlugs } from '../..'
import type { FieldConditions } from '../../fieldSchema'

import { shouldSendNotification } from '../../utils/notifications'

/** Matches a bare `{{token}}` entry — strict so partial tokens aren't resolved. */
const TOKEN_RE = /^\{\{\s*(\w+)\s*\}\}$/

/**
 * Extract admin/owner email addresses from a populated Team object.
 *
 * Requires depth ≥ 2 on the findByID call so that teamMembers and their users
 * are populated. Members with the `member` or `client` role are excluded —
 * only `admin` and `owner` receive team-addressed notifications.
 */
function getTeamAdminEmails(team: Team): string[] {
	return (team.teamMembers?.docs ?? [])
		.filter((tm): tm is TeamMember => typeof tm === 'object' && tm !== null)
		.filter((tm) => tm.role === 'owner' || tm.role === 'admin')
		.flatMap((tm) => {
			if (typeof tm.user !== 'object' || tm.user === null) {return []}
			const email = (tm.user as User).email
			return email ? [email] : []
		})
}

/**
 * Resolve a comma-separated email field value into concrete addresses.
 *
 * Supported entries:
 *   - Plain address:   "admin@example.com"
 *   - Field token:     "{{email}}" → submissionData['email'] (validated as email)
 *   - Team token:      "{{team}}"  → all admin/owner emails from the populated team
 */
function resolveRecipients(
	emailField: string,
	submissionData: Record<string, unknown>,
	team: null | Team | undefined,
): string[] {
	const entries = emailField
		.split(',')
		.map((s) => s.trim())
		.filter(Boolean)

	// Lazy-initialise team emails so we only query the team member list once
	let teamEmails: null | string[] = null
	const resolved: string[] = []

	for (const entry of entries) {
		const match = entry.match(TOKEN_RE)
		if (!match) {
			// Plain email address — use as-is
			resolved.push(entry)
			continue
		}

		const tokenName = match[1]

		if (tokenName === 'team') {
			teamEmails ??= team ? getTeamAdminEmails(team) : []
			resolved.push(...teamEmails)
		} else if (tokenName) {
			// Field token — resolve from submission data and validate as email
			const result = z.email().safeParse(submissionData[tokenName])
			if (result.success) {resolved.push(result.data)}
		}
	}

	return [...new Set(resolved)]
}

/**
 * Factory that returns the beforeChange hook on submissions.
 *
 * On create: snapshots the form schema, evaluates notification conditions,
 * resolves recipients (including field tokens and {{team}}), and sends emails.
 *
 * Email failures are caught individually and logged — a failed notification
 * must never roll back the submission itself.
 */
export function makeSubmissionNotifications(
	slugs: CollectionSlugs,
): CollectionBeforeChangeHook {
	return async ({ context, data, operation, req: { payload } }) => {
		// Skip individual emails during a batch import — the caller is responsible
		// for queuing a single post-batch notification via onBatchImportComplete.
		if (operation !== 'create' || context?.isBatchImport) {return data}

		type NotificationItem = {
			conditions?: unknown
			email: string
			message: unknown
			subject: string
		}

		type FormResult = {
			formSchema: unknown
			notification?: NotificationItem[] | null
			team: unknown
		}

		const [fetchErr, result] = await attemptAsync(() =>
			payload.findByID({
				id: data.form,
				collection: slugs.forms as 'forms',
				select: { formSchema: true, notification: true, team: true },
				// depth 2: form → team (depth 1) → teamMembers + their users (depth 2).
				// We need team members' emails to resolve the {{team}} token.
				// The populate option narrows which sub-documents are fetched at each level.
				depth: 2,
				populate: {
					teamMembers: { role: true, user: true },
					teams: { teamMembers: true },
				},
			}),
		)

		if (fetchErr || !result) {
			payload.logger.error(
				{ err: fetchErr, formId: data.form },
				'submissionNotifications: failed to fetch form — snapshot and notifications skipped',
			)
			return data
		}

		const form = result as unknown as FormResult
		data.formSnapshot = form.formSchema
		const submissionData = data.submissionData as Record<string, unknown>
		const team = form.team as null | Team | undefined

		const { notification } = form
		if (!notification?.length) {return data}

		// Build the list of send promises, filtering out items whose conditions
		// don't match or that resolve to an empty recipient list
		const sends = notification
			.filter((item: NotificationItem) => {
				const conditions = item.conditions as FieldConditions | null | undefined
				return shouldSendNotification(conditions, submissionData)
			})
			.map((item: NotificationItem) => {
				const recipients = resolveRecipients(item.email, submissionData, team)
				if (recipients.length === 0) {return null}

				const rawText = convertLexicalToPlaintext({ data: item.message as never })
				const rawHtml = convertLexicalToHTML({ data: item.message as never })
				const templateParser = replaceTemplatePlaceholders(submissionData)

				return { item, rawHtml, rawText, recipients, templateParser }
			})
			.filter((p): p is NonNullable<typeof p> => p !== null)

		// Send each notification individually so a single failure doesn't
		// prevent other recipients from receiving their emails
		for (const { item, rawHtml, rawText, recipients, templateParser } of sends) {
			const [sendErr] = await attemptAsync(() =>
				payload.sendEmail({
					html: templateParser(rawHtml),
					subject: templateParser(item.subject),
					text: templateParser(rawText),
					to: recipients,
				}),
			)

			if (sendErr) {
				// Log the failure but continue — losing a notification must not
				// cause the submission to fail or be rolled back. Callers that
				// require guaranteed delivery should use an async job queue.
				payload.logger.error(
					{
						err: sendErr,
						formId: data.form,
						subject: item.subject,
						to: recipients,
					},
					'submissionNotifications: failed to send notification email',
				)
			}
		}

		return data
	}
}
