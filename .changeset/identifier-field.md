---
"@spon/payload-forms": minor
---

Replace the hardcoded `from` submission field with a configurable `identifier` field.

**Breaking change:** the `from` field on the `submissions` collection has been renamed to `identifier`. Run `payload migrate` after upgrading to apply the schema change.

- Forms now have an **Identifier Field** selector in the Settings tab. Editors pick any scalar form field (text, email, number, select, etc.) whose value will be stored as the submission identifier, shown in the submissions list.
- The public submission endpoint no longer accepts or validates a `from` body field. The identifier is derived server-side from `submissionData` at submission time.
- CSV exports use `Identifier` as the column header instead of `From`.
- The Settings tab is now rendered correctly (previously `settings` plugin option fields were registered but never displayed).
