import type { FormValues } from '@forms/types'

export type ConditionOperator =
  | 'equals'
  | 'notEquals'
  | 'greaterThan'
  | 'lessThan'
  | 'greaterThanOrEquals'
  | 'lessThanOrEquals'
  | 'contains'
  | 'isEmpty'
  | 'isNotEmpty'
  | 'hasChanged'
  | 'hasNotChanged'

export type Condition = {
  field: string
  operator: ConditionOperator
  value?: string | number
}

export type FieldConditions = {
  logic: 'and' | 'or'
  conditions: Condition[]
}

/**
 * Evaluates a single condition against the current form values
 */
function evaluateCondition(condition: Condition, formValues: FormValues): boolean {
  const fieldValue = formValues[condition.field]
  const compareValue = condition.value

  switch (condition.operator) {
    case 'isEmpty':
      return (
        fieldValue === undefined ||
        fieldValue === null ||
        fieldValue === '' ||
        fieldValue === false ||
        (Array.isArray(fieldValue) && fieldValue.length === 0)
      )

    case 'isNotEmpty':
      return (
        fieldValue !== undefined &&
        fieldValue !== null &&
        fieldValue !== '' &&
        fieldValue !== false &&
        !(Array.isArray(fieldValue) && fieldValue.length === 0)
      )

    case 'equals':
      // Handle array values (checkboxes) - check if array contains the value
      if (Array.isArray(fieldValue)) {
        return fieldValue.some((v) => String(v) === String(compareValue))
      }
      // Handle numeric comparisons
      if (typeof fieldValue === 'number' && typeof compareValue === 'number') {
        return fieldValue === compareValue
      }
      // String comparison (loose equality for type coercion)
      return String(fieldValue) === String(compareValue)

    case 'notEquals':
      if (Array.isArray(fieldValue)) {
        return fieldValue.every((v) => String(v) !== String(compareValue))
      }
      if (typeof fieldValue === 'number' && typeof compareValue === 'number') {
        return fieldValue !== compareValue
      }
      return String(fieldValue) !== String(compareValue)

    case 'greaterThan': {
      const numFieldValue = Number(fieldValue)
      const numCompareValue = Number(compareValue)
      if (isNaN(numFieldValue) || isNaN(numCompareValue)) return false
      return numFieldValue > numCompareValue
    }

    case 'lessThan': {
      const numFieldValue = Number(fieldValue)
      const numCompareValue = Number(compareValue)
      if (isNaN(numFieldValue) || isNaN(numCompareValue)) return false
      return numFieldValue < numCompareValue
    }

    case 'greaterThanOrEquals': {
      const numFieldValue = Number(fieldValue)
      const numCompareValue = Number(compareValue)
      if (isNaN(numFieldValue) || isNaN(numCompareValue)) return false
      return numFieldValue >= numCompareValue
    }

    case 'lessThanOrEquals': {
      const numFieldValue = Number(fieldValue)
      const numCompareValue = Number(compareValue)
      if (isNaN(numFieldValue) || isNaN(numCompareValue)) return false
      return numFieldValue <= numCompareValue
    }

    case 'contains': {
      const strFieldValue = String(fieldValue ?? '')
      const strCompareValue = String(compareValue ?? '')
      return strFieldValue.toLowerCase().includes(strCompareValue.toLowerCase())
    }

    default:
      return true
  }
}

/**
 * Evaluates all conditions for a field and returns whether the field should be visible
 * Returns true if no conditions are defined (field always visible)
 */
export function evaluateConditions(
  conditions: FieldConditions | undefined | null,
  formValues: FormValues,
): boolean {
  // No conditions means always visible
  if (!conditions || !conditions.conditions || conditions.conditions.length === 0) {
    return true
  }

  const results = conditions.conditions.map((condition) => evaluateCondition(condition, formValues))

  // Apply logic (AND/OR)
  if (conditions.logic === 'and') {
    return results.every(Boolean)
  } else {
    return results.some(Boolean)
  }
}
