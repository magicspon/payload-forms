---
"@spon/payload-forms": minor
---

Remove built-in multitenancy support.

The `multitenancy` option has been removed from `FormsPluginConfig`. The plugin no longer injects a `team` relationship field, unique `(team, slug)` index, or any team-aware logic into the registered collections.

**Why:** the multitenancy implementation made assumptions about the host app's data model (a `teams` collection with `teamMembers`, `role`, and `user` fields) that don't hold in general. Users who need multitenancy can add their own relationship field via the `collections` override and handle access control in their own hooks.

**Breaking changes:**

- `FormsPluginConfig.multitenancy` removed — delete this option from your plugin config.
- The `{{team}}` email token in the Notifications tab no longer resolves to anything — remove it from any notification rules that use it.
- The public submission endpoint and CSV import endpoint no longer copy `team` from the form onto created submissions and uploads — if you relied on this propagation, add a `beforeChange` hook to the submissions collection.
- `FormImportButton` (CSV import UI) now shows a flat form list instead of a team-scoped picker.
