---
"@spon/payload-forms": minor
---

Security hardening for submissions, exports, and notification emails.

**Behavioural changes (review before upgrading):**

- **CSV export/import endpoints now require authentication by default.** `exportAccessCheck` and `importAccessCheck` default to `(req) => Boolean(req.user)` instead of `() => true`. These endpoints expose/ingest every submission for a form, so the previous open default leaked data. Pass your own check to apply custom rules, or `() => true` to opt back into public access (not recommended).
- **The public submission endpoint now strips unknown keys** from `submissionData`, keeping only values that map to a defined form field (matched by camelCase name). Clients can no longer persist arbitrary data into the stored document.
- **Malformed `submissionData` JSON is now rejected with `400`** instead of being silently stored as `{}`.

**Hardening:**

- **CSV formula injection (CWE-1236):** exported cells beginning with `= + - @` (or tab/CR) are prefixed with `'` so attacker-supplied submission values can't execute as formulas in Excel/Sheets.
- **HTML email injection:** submission values substituted into notification email HTML bodies are now HTML-escaped, preventing markup/script/phishing injection into recipients' inboxes. Plain-text and subject substitution are unchanged.
- **Submission size limits:** the public endpoint now caps `submissionData` at 1 MB, file attachments at 20 per submission, and total upload size at 25 MB (each returning `413`).
