import { type ConditionOperator, conditionOperators, type Field } from '@/shared/fieldSchema'

// hasChanged/hasNotChanged require previousDoc — only meaningful in notification rules
const changeOperators: string[] = ['hasChanged', 'hasNotChanged']
const numericOperators: string[] = [
  'greaterThan',
  'lessThan',
  'greaterThanOrEquals',
  'lessThanOrEquals',
]

/**
 * Operators offered for a given field type.
 *
 * - Numeric comparison operators are only offered for `number` fields.
 * - Change operators (`hasChanged`/`hasNotChanged`) require a `previousDoc` and
 *   are therefore only offered when `allowChangeOperators` is set (notification rules).
 */
export function getOperatorsForFieldType(
  fieldType: Field['type'] | undefined,
  allowChangeOperators = false,
) {
  return conditionOperators.filter((op) => {
    if (!allowChangeOperators && changeOperators.includes(op.value)) {
      return false
    }
    if (fieldType !== 'number' && numericOperators.includes(op.value)) {
      return false
    }
    return true
  })
}

/** Whether an operator needs a comparison value input rendered alongside it. */
export function operatorRequiresValue(operator: ConditionOperator): boolean {
  return (
    operator !== 'isEmpty' &&
    operator !== 'isNotEmpty' &&
    operator !== 'hasChanged' &&
    operator !== 'hasNotChanged'
  )
}
