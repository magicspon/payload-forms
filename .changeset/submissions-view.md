---
"@spon/payload-forms": minor
---

Add dedicated submissions view tab to the forms edit view.

Submissions are now shown in a first-class `/submissions` tab on the form edit page, replacing the hidden `join` field that previously linked to the submissions list. The tab uses a custom `SubmissionsView` server component and supports the configurable `submissionsSlug`.

**New:**

- `SubmissionsView` — server component rendered at `/admin/collections/forms/:id/submissions`.
- `FormsCollectionOptions.submissionsSlug` — pass a custom submissions slug to `buildFormsCollection`; the plugin now forwards `slugs.submissions` automatically.

**Breaking changes:**

- The hidden `submissions` join field has been removed from the forms collection. If you were querying `form.submissions` via the Local API at depth ≥ 1, switch to a direct `payload.find({ collection: 'submissions', where: { form: { equals: id } } })` query instead.
- `FormSubmissionListViewButton` has been removed from the submissions list view actions.
