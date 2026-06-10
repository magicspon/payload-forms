import type { ChangeEvent } from 'react'

import { type Condition, type ConditionOperator, type Field } from '@/shared/fieldSchema'
import { SelectInput, TextInput, XIcon } from '@payloadcms/ui'

import styles from './conditions.module.css'
import { getOperatorsForFieldType, operatorRequiresValue } from './operators'

type ConditionRowProps = {
  allowChangeOperators?: boolean
  availableFields: Field[]
  condition: Condition
  includeTestIds?: boolean
  index: number
  namePrefix: string
  onRemove: (index: number) => void
  onUpdate: (index: number, condition: Condition) => void
}

/** Read the single value out of a react-select onChange option, ignoring multi-select shapes. */
function optionValue(option: unknown): string {
  return !Array.isArray(option) && option ? String((option as { value: unknown }).value) : ''
}

export function ConditionRow({
  allowChangeOperators,
  availableFields,
  condition,
  includeTestIds,
  index,
  namePrefix,
  onRemove,
  onUpdate,
}: ConditionRowProps) {
  const selectedField = availableFields.find(
    (f) => f.type !== 'message' && f.name === condition.field,
  )
  const operators = getOperatorsForFieldType(selectedField?.type, allowChangeOperators)
  const showValueInput = operatorRequiresValue(condition.operator)
  const fieldOptions = selectedField && 'options' in selectedField ? selectedField.options : null

  const fieldName = `${namePrefix}-field-${index}`
  const operatorName = `${namePrefix}-operator-${index}`
  const valueName = `${namePrefix}-value-${index}`

  return (
    <div
      className={styles.conditionRow}
      data-testid={includeTestIds ? 'condition-row' : undefined}
    >
      <SelectInput
        label={index === 0 ? 'Field' : undefined}
        name={fieldName}
        onChange={(option) => {
          onUpdate(index, { ...condition, field: optionValue(option), value: undefined })
        }}
        options={availableFields
          .filter((f) => f.type !== 'message')
          .map((f) => ({ label: f.label || f.name, value: f.name }))}
        path={fieldName}
        placeholder="Select field..."
        value={condition.field}
      />

      <SelectInput
        label={index === 0 ? 'Condition' : undefined}
        name={operatorName}
        onChange={(option) => {
          const operator = (optionValue(option) || 'equals') as ConditionOperator
          const next: Condition = { ...condition, operator }
          if (!operatorRequiresValue(operator)) {
            delete next.value
          }
          onUpdate(index, next)
        }}
        options={operators.map((op) => ({ label: op.label, value: op.value }))}
        path={operatorName}
        value={condition.operator}
      />

      {showValueInput ? (
        fieldOptions ? (
          <SelectInput
            isClearable
            label={index === 0 ? 'Value' : undefined}
            name={valueName}
            onChange={(option) => {
              onUpdate(index, { ...condition, value: optionValue(option) })
            }}
            options={fieldOptions.map((opt) => ({ label: opt.label || opt.value, value: opt.value }))}
            path={valueName}
            placeholder="Select value..."
            value={String(condition.value ?? '')}
          />
        ) : selectedField?.type === 'number' ? (
          <TextInput
            label={index === 0 ? 'Value' : undefined}
            onChange={(e: ChangeEvent<HTMLInputElement>) => {
              const numValue = e.target.value ? Number(e.target.value) : undefined
              onUpdate(index, { ...condition, value: numValue })
            }}
            path={valueName}
            placeholder="Enter number..."
            value={String(condition.value ?? '')}
          />
        ) : (
          <TextInput
            label={index === 0 ? 'Value' : undefined}
            onChange={(e: ChangeEvent<HTMLInputElement>) => {
              onUpdate(index, { ...condition, value: e.target.value })
            }}
            path={valueName}
            placeholder="Enter value..."
            value={String(condition.value ?? '')}
          />
        )
      ) : (
        <div className={index === 0 ? styles.spacer : undefined} />
      )}

      <div className={styles.removeButtonWrap}>
        <button
          aria-label="Remove condition"
          className={styles.removeButton}
          data-testid={includeTestIds ? 'condition-remove-button' : undefined}
          onClick={() => onRemove(index)}
          type="button"
        >
          <XIcon />
          <span className={styles.srOnly}>Remove condition</span>
        </button>
      </div>
    </div>
  )
}
