---
"@spon/payload-forms": patch
---

Reduce complexity of the highest-risk hotspots by extracting their logic into pure, unit-tested helpers. Internal refactor only — no public API or behavioural changes.

- **Submission endpoint:** the `submission.ts` handler (previously a single 271-line function) is split into a `submissionPipeline.ts` module — `checkSpamSignals`, `parseSubmissionData`, `collectFiles`, `loadFormContext`, `cleanSubmissionData`, `deriveIdentifier`, and `uploadFiles` — each returning a short-circuit response or its value. Spam-check ordering and all early exits are preserved.
- **Form builder:** extracted CSV import logic (`inferFieldType`, `computeNameErrors`, `buildMappingsFromHeaders`, `buildFieldsFromMappings`, `applyInsertMode`) into `importSchema.utils.ts`, the editor form validation (`computeFieldErrors`) out of `EditorFormContext`, and the `useFormBuilder` state reducer into `formBuilderReducer.ts`.
- **Submissions UI:** extracted cell-display classification into `formatCellValue.ts`, CSV import batching/upload (`chunkRows`, `importBatches`) into `formImport.utils.ts`, and form-id resolution/column derivation (`resolveFormId`, `deriveColumns`, `parsePageParam`) into `submissionsView.utils.ts`.

Adds 103 unit tests covering the extracted logic.
