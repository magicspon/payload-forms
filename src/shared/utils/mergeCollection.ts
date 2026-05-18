import type { DeepPartial } from '@/types'
import type { CollectionConfig } from 'payload'

/**
 * Merge a partial collection config override into a base CollectionConfig.
 *
 * Strategy:
 * - `fields`: base fields first, then override fields appended
 * - `hooks.*`: base hooks first, then override hooks appended
 * - `endpoints`: base endpoints first, then override endpoints appended
 * - `access`: override completely replaces base (no partial merge)
 * - `admin`: shallow spread (override wins per key)
 * - `admin.components`: shallow spread
 * - All other scalar properties: override wins
 */
export function mergeCollection(
	base: CollectionConfig,
	override: DeepPartial<CollectionConfig> | undefined,
): CollectionConfig {
	if (!override) {return base}

	const { access, admin, endpoints, fields, hooks, ...rest } = override

	const merged: CollectionConfig = {
		...base,
		...(rest as Partial<CollectionConfig>),
	}

	// access — full replace if provided
	if (access) {
		merged.access = access as CollectionConfig['access']
	}

	// fields — append
	if (fields && Array.isArray(fields)) {
		merged.fields = [
			...(base.fields ?? []),
			...(fields as CollectionConfig['fields']),
		]
	}

	// endpoints — append
	if (endpoints && Array.isArray(endpoints)) {
		const baseEndpoints = Array.isArray(base.endpoints) ? base.endpoints : []
		merged.endpoints = [
			...baseEndpoints,
			...(endpoints),
		]
	}

	// hooks — merge per lifecycle key
	if (hooks) {
		merged.hooks = { ...base.hooks }
		for (const key of Object.keys(hooks) as Array<keyof typeof hooks>) {
			const overrideHooks = hooks[key]
			const baseHooks = base.hooks?.[key]
			if (Array.isArray(overrideHooks)) {
				merged.hooks[key] = [
					...(Array.isArray(baseHooks) ? baseHooks : []),
					...overrideHooks,
				] as CollectionConfig['hooks'][keyof CollectionConfig['hooks']]
			}
		}
	}

	// admin — shallow spread, then merge components
	if (admin) {
		merged.admin = {
			...base.admin,
			...(admin as Partial<CollectionConfig['admin']>),
		}

		const adminComponents = (admin as CollectionConfig['admin'])?.components
		const baseComponents = base.admin?.components

		if (adminComponents || baseComponents) {
			merged.admin.components = {
				...baseComponents,
				...adminComponents,
			}
		}
	}

	return merged
}
