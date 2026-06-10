import { type Condition, type Field, type FieldConditions } from '@/shared/fieldSchema'
import { Stack } from '@/shared/layout'
import { Button, PlusIcon } from '@payloadcms/ui'

import { ConditionRow } from './ConditionRow'
import styles from './conditions.module.css'

type ConditionBuilderProps = {
  allowChangeOperators?: boolean
  availableFields: Field[]
  /** Shown when there are no fields available to build a condition against. */
  emptyFieldsText: string
  headerLabel: string
  includeTestIds?: boolean
  /** Prefix for input `name`/`path` attributes; must be unique per editor instance kind. */
  namePrefix: string
  /** Shown when fields exist but no conditions are configured yet. */
  noConditionsText: string
  /** Emits the next conditions object, or `null` when the last condition is removed. */
  onChange: (next: FieldConditions | null) => void
  value: FieldConditions | null | undefined
}

/**
 * Shared conditional-logic builder used by the field-visibility editor and both
 * notification condition editors. Callers supply the available fields, current
 * value, and an `onChange` sink; data fetching and persistence live in the wrappers.
 */
export function ConditionBuilder({
  allowChangeOperators,
  availableFields,
  emptyFieldsText,
  headerLabel,
  includeTestIds,
  namePrefix,
  noConditionsText,
  onChange,
  value,
}: ConditionBuilderProps) {
  const conditionsList = value?.conditions ?? []
  const logic = value?.logic ?? 'and'

  const commit = (newConditions: Condition[], newLogic?: 'and' | 'or') => {
    if (newConditions.length === 0) {
      onChange(null)
    } else {
      onChange({ conditions: newConditions, logic: newLogic ?? logic })
    }
  }

  const addCondition = () => {
    commit([...conditionsList, { field: '', operator: 'equals', value: '' }])
  }

  const updateCondition = (index: number, condition: Condition) => {
    const next = [...conditionsList]
    next[index] = condition
    commit(next)
  }

  const removeCondition = (index: number) => {
    commit(conditionsList.filter((_, i) => i !== index))
  }

  const toggleLogic = () => {
    commit(conditionsList, logic === 'and' ? 'or' : 'and')
  }

  if (availableFields.length === 0) {
    return (
      <div className={styles.emptyState}>
        <p className={styles.emptyText}>{emptyFieldsText}</p>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <p className={styles.headerLabel}>{headerLabel}</p>
        {conditionsList.length > 1 && (
          <Button margin={false} onClick={toggleLogic} size="small" type="button">
            {logic === 'and' ? 'Match ALL' : 'Match ANY'}
          </Button>
        )}
      </div>

      {conditionsList.length > 0 ? (
        <Stack className={styles.conditionsList}>
          {conditionsList.map((condition, index) => (
            <div key={index}>
              {index > 0 && <div className={styles.logicSeparator}>{logic}</div>}
              <ConditionRow
                allowChangeOperators={allowChangeOperators}
                availableFields={availableFields}
                condition={condition}
                includeTestIds={includeTestIds}
                index={index}
                namePrefix={namePrefix}
                onRemove={removeCondition}
                onUpdate={updateCondition}
              />
            </div>
          ))}
        </Stack>
      ) : (
        <p className={styles.noConditionsText}>{noConditionsText}</p>
      )}

      <Button className={styles.addButton} onClick={addCondition} type="button">
        <PlusIcon />
        Add Condition
      </Button>
    </div>
  )
}
