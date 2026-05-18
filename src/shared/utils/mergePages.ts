import type { FormPage, FormRow } from '@/form-builder/utils/formTree'
import type { Field } from '@/shared/fieldSchema'

/**
 * Merge the canonical (default locale) page structure into an existing locale's pages.
 *
 * Rules:
 * - Page order and IDs always come from `canonical`
 * - If `locale` has a matching page ID, keep its `title`, `backButton`, `nextButton`
 * - Row order and IDs always come from `canonical`
 * - Field order and IDs always come from `canonical`
 * - If `locale` has a matching field ID, keep its translatable strings
 *   (label, placeholder, errorMessage, instructions, option labels)
 * - Structural/non-translatable field properties always come from `canonical`
 *
 * (FR-039)
 */
export function mergePages(
	canonical: FormPage[],
	locale: FormPage[] | null | undefined,
): FormPage[] {
	const localePageMap = new Map((locale ?? []).map((page) => [page.id, page]))

	return canonical.map((canonicalPage) => {
		const localePage = localePageMap.get(canonicalPage.id)

		return {
			...canonicalPage,
			backButton: localePage?.backButton ?? canonicalPage.backButton,
			nextButton: localePage?.nextButton ?? canonicalPage.nextButton,
			rows: canonicalPage.rows.map((canonicalRow) =>
				mergeRow(canonicalRow, localePage),
			),
			title: localePage?.title ?? canonicalPage.title,
		}
	})
}

function mergeRow(
	canonicalRow: FormRow,
	localePage: FormPage | undefined,
): FormRow {
	const localeFieldMap = new Map<string, Field>(
		(localePage?.rows ?? []).flatMap((row) =>
			row.columns.map((field) => [field.id, field]),
		),
	)

	return {
		...canonicalRow,
		columns: canonicalRow.columns.map((canonicalField) =>
			mergeField(canonicalField, localeFieldMap.get(canonicalField.id)),
		),
	}
}

type NonMessageField = Exclude<Field, { type: 'message' }>

function mergeField(canonical: Field, locale: Field | undefined): Field {
	if (!locale || locale.type !== canonical.type) {return canonical}
	if (canonical.type === 'message') {return canonical}

	const c = canonical as NonMessageField
	const l = locale as NonMessageField

	const merged: NonMessageField = {
		...c,
		errorMessage: l.errorMessage ?? c.errorMessage,
		instructions: l.instructions ?? c.instructions,
		label: l.label ?? c.label,
	}

	if (
		merged.type === 'radio' ||
		merged.type === 'checkbox' ||
		merged.type === 'select'
	) {
		const localeOpts = (l as typeof merged).options
		const localeOptionByValue = new Map(
			localeOpts.map((o) => [o.value, o.label]),
		)
		const withOptions: typeof merged = {
			...merged,
			options: merged.options.map((opt) => ({
				label: localeOptionByValue.get(opt.value) ?? opt.label,
				value: opt.value,
			})),
		}

		if (withOptions.type === 'select') {
			return {
				...withOptions,
				placeholder:
					(l as typeof withOptions).placeholder ?? withOptions.placeholder,
			}
		}

		return withOptions
	}

	if (
		merged.type === 'text' ||
		merged.type === 'textarea' ||
		merged.type === 'email' ||
		merged.type === 'number' ||
		merged.type === 'date'
	) {
		return {
			...merged,
			placeholder: (l as typeof merged).placeholder ?? merged.placeholder,
		}
	}

	return merged
}
