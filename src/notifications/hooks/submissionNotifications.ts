import type { FieldConditions } from '@/shared/fieldSchema'
import type { CollectionBeforeChangeHook, Payload } from 'payload'

import { shouldSendNotification } from '@/notifications/utils/notifications'
import { attemptAsync } from '@/shared/utils/attemptAsync'
import { escapeHtml, replaceTemplatePlaceholders } from '@/shared/utils/replaceDataPlaceholders'
import { convertLexicalToHTML } from '@payloadcms/richtext-lexical/html'
import { convertLexicalToPlaintext } from '@payloadcms/richtext-lexical/plaintext'
import { z } from 'zod'

import type { CollectionSlugs } from '../..'

export type BeforeEmailData = {
  bcc: string[]
  cc: string[]
  html: string
  subject: string
  text: string
  to: string[]
}

export type BeforeEmailHook = (
  args: BeforeEmailData,
) => false | Promise<false | void> | void

/** Matches a bare `{{token}}` entry — strict so partial tokens aren't resolved. */
const TOKEN_RE = /^\{\{\s*(\w+)\s*\}\}$/

/**
 * Resolve a comma-separated email field value into concrete addresses.
 *
 * Supported entries:
 *   - Plain address:   "admin@example.com"
 *   - Field token:     "{{email}}" → submissionData['email'] (validated as email)
 */
function resolveRecipients(emailField: string, submissionData: Record<string, unknown>): string[] {
  const entries = emailField
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)

  const resolved: string[] = []

  for (const entry of entries) {
    const match = entry.match(TOKEN_RE)
    if (!match) {
      resolved.push(entry)
      continue
    }

    const tokenName = match[1]
    if (tokenName) {
      const result = z.email().safeParse(submissionData[tokenName])
      if (result.success) {
        resolved.push(result.data)
      }
    }
  }

  return [...new Set(resolved)]
}

type NotificationItem = {
  bcc?: string
  cc?: string
  conditions?: unknown
  email: string
  message: unknown
  subject: string
}

type FormResult = {
  formSchema: unknown
  notification?: NotificationItem[] | null
}

type TemplateParser = ReturnType<typeof replaceTemplatePlaceholders>

type PreparedSend = {
  htmlTemplateParser: TemplateParser
  item: NotificationItem
  rawHtml: string
  rawText: string
  recipients: string[]
  templateParser: TemplateParser
}

/**
 * Filter notifications down to those whose conditions match and that resolve to
 * at least one recipient, pre-rendering their templates for dispatch.
 */
function prepareSends(
  notification: NotificationItem[],
  submissionData: Record<string, unknown>,
): PreparedSend[] {
  return notification
    .filter((item) =>
      shouldSendNotification(item.conditions as FieldConditions | null | undefined, submissionData),
    )
    .map((item): null | PreparedSend => {
      const recipients = resolveRecipients(item.email, submissionData)
      if (recipients.length === 0) {
        return null
      }

      const rawText = convertLexicalToPlaintext({ data: item.message as never })
      const rawHtml = convertLexicalToHTML({ data: item.message as never })
      // Plain-text/subject substitution is verbatim; HTML substitution
      // escapes each value so attacker-controlled fields can't inject markup.
      const templateParser = replaceTemplatePlaceholders(submissionData)
      const htmlTemplateParser = replaceTemplatePlaceholders(submissionData, escapeHtml)

      return { htmlTemplateParser, item, rawHtml, rawText, recipients, templateParser }
    })
    .filter((p): p is PreparedSend => p !== null)
}

/**
 * Send a single prepared notification. Errors are logged and swallowed — losing
 * a notification must never roll back the submission. The beforeEmail hook may
 * cancel the send by returning `false`.
 */
async function dispatchNotification(
  payload: Payload,
  formId: unknown,
  submissionData: Record<string, unknown>,
  prepared: PreparedSend,
  beforeEmail?: BeforeEmailHook,
): Promise<void> {
  const { htmlTemplateParser, item, rawHtml, rawText, recipients, templateParser } = prepared

  const emailData: BeforeEmailData = {
    bcc: item.bcc ? resolveRecipients(item.bcc, submissionData) : [],
    cc: item.cc ? resolveRecipients(item.cc, submissionData) : [],
    html: htmlTemplateParser(rawHtml),
    subject: templateParser(item.subject),
    text: templateParser(rawText),
    to: recipients,
  }

  if (beforeEmail) {
    const [hookErr, hookResult] = await attemptAsync(() => Promise.resolve(beforeEmail(emailData)))
    if (hookErr) {
      payload.logger.error(
        { err: hookErr, formId, subject: item.subject },
        'submissionNotifications: beforeEmail hook threw — send will proceed',
      )
    } else if (hookResult === false) {
      return
    }
  }

  const [sendErr] = await attemptAsync(() =>
    payload.sendEmail({
      bcc: emailData.bcc,
      cc: emailData.cc,
      html: emailData.html,
      subject: emailData.subject,
      text: emailData.text,
      to: emailData.to,
    }),
  )

  if (sendErr) {
    payload.logger.error(
      { err: sendErr, formId, subject: item.subject, to: recipients },
      'submissionNotifications: failed to send notification email',
    )
  }
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
  beforeEmail?: BeforeEmailHook,
): CollectionBeforeChangeHook {
  return async ({ context, data, operation, req: { payload } }) => {
    // Skip individual emails during a batch import — the caller is responsible
    // for queuing a single post-batch notification via onBatchImportComplete.
    if (operation !== 'create' || context?.isBatchImport) {
      return data
    }

    const [fetchErr, result] = await attemptAsync(() =>
      payload.findByID({
        id: data.form,
        collection: slugs.forms as 'forms',
        select: { formSchema: true, notification: true },
        depth: 0,
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

    const { notification } = form
    if (!notification?.length) {
      return data
    }

    // Send each notification individually so a single failure doesn't
    // prevent other recipients from receiving their emails
    for (const prepared of prepareSends(notification, submissionData)) {
      await dispatchNotification(payload, data.form, submissionData, prepared, beforeEmail)
    }

    return data
  }
}
