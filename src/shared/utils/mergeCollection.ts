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
  if (!override) {
    return base
  }

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
    merged.fields = [...(base.fields ?? []), ...(fields as CollectionConfig['fields'])]
  }

  // endpoints — append
  if (endpoints && Array.isArray(endpoints)) {
    const baseEndpoints = Array.isArray(base.endpoints) ? base.endpoints : []
    merged.endpoints = [...baseEndpoints, ...endpoints]
  }

  // hooks — merge per lifecycle key
  if (hooks) {
    merged.hooks = mergeHooks(base.hooks, hooks)
  }

  // admin — shallow spread, then merge components
  if (admin) {
    merged.admin = mergeAdmin(base.admin, admin)
  }

  return merged
}

/** Append override hook arrays onto the base hooks, per lifecycle key. */
function mergeHooks(
  baseHooks: CollectionConfig['hooks'],
  overrideHooks: NonNullable<DeepPartial<CollectionConfig>['hooks']>,
): CollectionConfig['hooks'] {
  const merged: CollectionConfig['hooks'] = { ...baseHooks }
  for (const key of Object.keys(overrideHooks) as Array<keyof typeof overrideHooks>) {
    const overrideForKey = overrideHooks[key]
    if (!Array.isArray(overrideForKey)) {
      continue
    }
    const baseForKey = baseHooks?.[key]
    merged[key] = [
      ...(Array.isArray(baseForKey) ? baseForKey : []),
      ...overrideForKey,
    ] as CollectionConfig['hooks'][keyof CollectionConfig['hooks']]
  }
  return merged
}

/** Shallow-spread admin config, then shallow-merge its `components`. */
function mergeAdmin(
  baseAdmin: CollectionConfig['admin'],
  overrideAdmin: NonNullable<DeepPartial<CollectionConfig>['admin']>,
): CollectionConfig['admin'] {
  const merged: CollectionConfig['admin'] = {
    ...baseAdmin,
    ...(overrideAdmin as Partial<CollectionConfig['admin']>),
  }

  const overrideComponents = (overrideAdmin as CollectionConfig['admin'])?.components
  const baseComponents = baseAdmin?.components
  if (overrideComponents || baseComponents) {
    merged.components = {
      ...baseComponents,
      ...overrideComponents,
    }
  }

  return merged
}
