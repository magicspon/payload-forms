/** Returns true when value is a non-empty array of plain objects (e.g. uploaded file docs). */
function isObjectArray(value: unknown): value is Record<string, unknown>[] {
	return (
		Array.isArray(value) &&
		value.length > 0 &&
		typeof value[0] === 'object' &&
		value[0] !== null
	)
}

/**
 * Replace {{ fieldName }} placeholders with submission values.
 * Handles whitespace variations: {{name}}, {{ name }}, {{  name  }}
 */
export function replaceTemplatePlaceholders(
	submissionData: Record<string, unknown>,
): (template: string) => string {
	return (template: string) =>
		template.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, fieldName) => {
			const value = submissionData[fieldName]
			if (value === undefined || value === null) {
				return ''
			}
			if (Array.isArray(value)) {
				return value.join(', ')
			}
			return String(value as bigint | boolean | number | string)
		})
}

export function replaceDataPlaceholders(
	submissionData: Record<string, unknown>,
): <T>(value: T) => T {
	/**
	 * Replace a single placeholder string.
	 *
	 * Pure `{{ fieldName }}` strings (no surrounding text) may return a
	 * non-string when the submission value is an object (e.g. a full upload
	 * document). Mixed strings always return a string.
	 */
	const replaceInString = (str: string): unknown => {
		// Pure placeholder — entire string is "{{ fieldName }}"
		const pureMatch = str.match(/^\{\{\s*(\w+)\s*\}\}$/)
		if (pureMatch) {
			const fieldName = pureMatch[1]
			const value = submissionData[fieldName]
			if (value === undefined || value === null) {return ''}
			if (isObjectArray(value)) {return value[0]}
			if (typeof value === 'object') {return value}
			if (Array.isArray(value)) {return (value as unknown[]).join(', ')}
			return String(value as bigint | boolean | number | string)
		}
		// Mixed string — all replacements must produce strings
		return str.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, fieldName) => {
			const value = submissionData[fieldName]
			if (value === undefined || value === null) {return ''}
			if (Array.isArray(value)) {return (value as unknown[]).join(', ')}
			return String(value as bigint | boolean | number | string)
		})
	}

	const traverse = (value: unknown): unknown => {
		if (typeof value === 'string') {return replaceInString(value)}
		if (Array.isArray(value)) {return value.map(traverse)}
		if (value && typeof value === 'object') {
			const obj = value as Record<string, unknown>

			// First pass: detect dynamic_${key} companion fields and resolve them
			// into the main key when the companion placeholder resolves to an object
			// (e.g. a full upload document). The companion key is then stripped.
			const overrides: Record<string, unknown> = {}
			const keysToStrip = new Set<string>()
			for (const [key, val] of Object.entries(obj)) {
				if (!key.startsWith('dynamic_')) {continue}
				const baseKey = key.slice('dynamic_'.length)
				const resolved =
					typeof val === 'string' ? replaceInString(val) : undefined
				if (
					resolved !== undefined &&
					typeof resolved === 'object' &&
					resolved !== null
				) {
					overrides[baseKey] = resolved
					keysToStrip.add(key)
				}
			}

			return Object.fromEntries(
				Object.entries(obj)
					.filter(([key]) => !keysToStrip.has(key))
					.map(([key, val]) => [
						key,
						key in overrides ? overrides[key] : traverse(val),
					]),
			)
		}
		return value
	}

	return traverse as <T>(value: T) => T
}
