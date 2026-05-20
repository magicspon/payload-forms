'use client'

import type { FormPage, FormValues } from '@forms/types'
import { useStore } from '@tanstack/react-form'
import type { ReadonlyStore } from '@tanstack/store'
import { useMemo } from 'react'
import { type FieldConditions, evaluateConditions } from './evaluateConditions'

type FieldWithConditions = {
  name: string
  conditions?: FieldConditions | null
}

// Type for fields that may have conditions (cast needed until Payload types are regenerated)
type FieldWithPossibleConditions = {
  conditions?: FieldConditions | null
}

/**
 * Extracts all fields with their conditions from pages
 */
function getFieldsWithConditions(pages: FormPage[] | null | undefined): FieldWithConditions[] {
  if (!pages) return []

  const fields: FieldWithConditions[] = []

  for (const page of pages) {
    for (const row of page.rows) {
      for (const field of row.columns) {
        const fieldWithConditions = field as typeof field & FieldWithPossibleConditions
        // Message fields don't have a name but can still have conditions
        if (field.type === 'message') {
          fields.push({
            name: field.id, // Use ID for message fields
            conditions: fieldWithConditions.conditions,
          })
        } else {
          fields.push({
            name: field.name,
            conditions: fieldWithConditions.conditions,
          })
        }
      }
    }
  }

  return fields
}

/**
 * Hook that tracks conditional field visibility based on form values
 *
 * @param pages - The form pages configuration
 * @param form - The TanStack form instance (must have a store property)
 * @returns A function that checks if a field is visible by name
 */
export function useConditionalFields<TState extends { values: FormValues }>(
  pages: FormPage[] | null | undefined,
  form: { store: ReadonlyStore<TState> },
) {
  // Extract fields with conditions (memoized since pages rarely change)
  const fieldsWithConditions = useMemo(() => getFieldsWithConditions(pages), [pages])

  // Subscribe to form values using the store
  const formValues = useStore(form.store, (state) => state.values)

  // Create visibility checker function
  const isFieldVisible = useMemo(() => {
    return (fieldName: string): boolean => {
      const fieldConfig = fieldsWithConditions.find((f) => f.name === fieldName)

      // No config found means field is always visible
      if (!fieldConfig) return true

      // Evaluate conditions against current form values
      return evaluateConditions(fieldConfig.conditions, formValues)
    }
  }, [fieldsWithConditions, formValues])

  return isFieldVisible
}
