import type { CollectionConfig } from 'payload'

import { describe, expect, it, vi } from 'vitest'

import { mergeCollection } from './mergeCollection'

// Minimal CollectionConfig fixture — only what's needed per test
function baseCollection(overrides: Partial<CollectionConfig> = {}): CollectionConfig {
  return {
    slug: 'test',
    fields: [{ name: 'title', type: 'text' }],
    ...overrides,
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// No override
// ─────────────────────────────────────────────────────────────────────────────

describe('mergeCollection — no override', () => {
  it('returns base unchanged when override is undefined', () => {
    const base = baseCollection()
    expect(mergeCollection(base, undefined)).toBe(base)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Scalar properties
// ─────────────────────────────────────────────────────────────────────────────

describe('mergeCollection — scalar properties', () => {
  it('override slug wins over base', () => {
    const merged = mergeCollection(baseCollection(), { slug: 'override' })
    expect(merged.slug).toBe('override')
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// fields — append strategy
// ─────────────────────────────────────────────────────────────────────────────

describe('mergeCollection — fields', () => {
  it('appends override fields after base fields', () => {
    const base = baseCollection({
      fields: [{ name: 'title', type: 'text' }],
    })
    const merged = mergeCollection(base, {
      fields: [{ name: 'extra', type: 'email' }],
    })
    expect(merged.fields).toHaveLength(2)
    expect((merged.fields[0] as { name: string }).name).toBe('title')
    expect((merged.fields[1] as { name: string }).name).toBe('extra')
  })

  it('preserves base fields when override has no fields', () => {
    const base = baseCollection()
    const merged = mergeCollection(base, { slug: 'other' })
    expect(merged.fields).toEqual(base.fields)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// endpoints — append strategy
// ─────────────────────────────────────────────────────────────────────────────

describe('mergeCollection — endpoints', () => {
  const baseEndpoint = {
    handler: vi.fn(),
    method: 'get' as const,
    path: '/base',
  }
  const overrideEndpoint = {
    handler: vi.fn(),
    method: 'post' as const,
    path: '/extra',
  }

  it('appends override endpoints after base endpoints', () => {
    const base = baseCollection({ endpoints: [baseEndpoint] })
    const merged = mergeCollection(base, { endpoints: [overrideEndpoint] })
    const eps = merged.endpoints as (typeof baseEndpoint)[]
    expect(eps).toHaveLength(2)
    expect(eps[0].path).toBe('/base')
    expect(eps[1].path).toBe('/extra')
  })

  it('handles base with no endpoints', () => {
    const base = baseCollection()
    const merged = mergeCollection(base, { endpoints: [overrideEndpoint] })
    expect(merged.endpoints as (typeof overrideEndpoint)[]).toHaveLength(1)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// hooks — append per lifecycle key
// ─────────────────────────────────────────────────────────────────────────────

describe('mergeCollection — hooks', () => {
  it('appends override beforeChange hooks after base hooks', () => {
    const baseHook = vi.fn()
    const overrideHook = vi.fn()
    const base = baseCollection({ hooks: { beforeChange: [baseHook] } })
    const merged = mergeCollection(base, {
      hooks: { beforeChange: [overrideHook] },
    })
    expect(merged.hooks?.beforeChange).toHaveLength(2)
    expect(merged.hooks?.beforeChange?.[0]).toBe(baseHook)
    expect(merged.hooks?.beforeChange?.[1]).toBe(overrideHook)
  })

  it('appends afterChange hooks independently', () => {
    const afterHook = vi.fn()
    const base = baseCollection({ hooks: { beforeChange: [vi.fn()] } })
    const merged = mergeCollection(base, {
      hooks: { afterChange: [afterHook] },
    })
    expect(merged.hooks?.afterChange).toHaveLength(1)
    expect(merged.hooks?.afterChange?.[0]).toBe(afterHook)
    // base beforeChange preserved
    expect(merged.hooks?.beforeChange).toHaveLength(1)
  })

  it('preserves base hooks when override has no hooks', () => {
    const baseHook = vi.fn()
    const base = baseCollection({ hooks: { beforeChange: [baseHook] } })
    const merged = mergeCollection(base, { slug: 'other' })
    expect(merged.hooks?.beforeChange?.[0]).toBe(baseHook)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// access — full replace strategy
// ─────────────────────────────────────────────────────────────────────────────

describe('mergeCollection — access', () => {
  it('completely replaces base access with override access', () => {
    const baseCreate = vi.fn(() => true)
    const overrideRead = vi.fn(() => false)
    const base = baseCollection({ access: { create: baseCreate } })
    const merged = mergeCollection(base, { access: { read: overrideRead } })
    // override's access replaces entirely — base create is gone
    expect(merged.access?.read).toBe(overrideRead)
    expect(merged.access?.create).toBeUndefined()
  })

  it('preserves base access when no override access provided', () => {
    const baseCreate = vi.fn(() => true)
    const base = baseCollection({ access: { create: baseCreate } })
    const merged = mergeCollection(base, { slug: 'new' })
    expect(merged.access?.create).toBe(baseCreate)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// admin — shallow spread + components merge
// ─────────────────────────────────────────────────────────────────────────────

describe('mergeCollection — admin', () => {
  it('shallow-merges admin config (override wins per key)', () => {
    const base = baseCollection({
      admin: { defaultColumns: ['title'], useAsTitle: 'title' },
    })
    const merged = mergeCollection(base, {
      admin: { useAsTitle: 'name' },
    })
    expect(merged.admin?.useAsTitle).toBe('name')
    // base key still present
    expect(merged.admin?.defaultColumns).toEqual(['title'])
  })

  it('merges admin.components with shallow spread', () => {
    // cast to never to avoid CustomComponent type constraints — the test
    // is only verifying the spread behaviour, not component types
    const BaseAfter = () => null
    const OverrideBeforeList = () => null
    const base = baseCollection({
      admin: { components: { afterList: [BaseAfter as never] } },
    })
    const merged = mergeCollection(base, {
      admin: {
        components: { beforeList: [OverrideBeforeList as never] },
      } as never,
    })
    expect(merged.admin?.components?.afterList).toEqual([BaseAfter])
    expect(merged.admin?.components?.beforeList).toEqual([OverrideBeforeList])
  })

  it('preserves base admin when override has no admin', () => {
    const base = baseCollection({ admin: { useAsTitle: 'title' } })
    const merged = mergeCollection(base, { slug: 'new' })
    expect(merged.admin?.useAsTitle).toBe('title')
  })
})
