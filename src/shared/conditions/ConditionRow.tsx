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

type ConditionValueInputProps = {
  condition: Condition
  fieldOptions: null | { label: string; value: string }[]
  index: number
  onUpdate: (index: number, condition: Condition) => void
  selectedFieldType?: Field['type']
  showValueInput: boolean
  valueName: string
}

/**
 * Renders the value control for a condition row, picking the input by field
 * shape: option-backed select, number input, or plain text. Renders a spacer
 * when the operator takes no value (e.g. isEmpty).
 */
function ConditionValueInput({
  condition,
  fieldOptions,
  index,
  onUpdate,
  selectedFieldType,
  showValueInput,
  valueName,
}: ConditionValueInputProps) {
  if (!showValueInput) {
    return <div className={index === 0 ? styles.spacer : undefined} />
  }

  const label = index === 0 ? 'Value' : undefined
  const currentValue = String(condition.value ?? '')

  if (fieldOptions) {
    return (
      <SelectInput
        isClearable
        label={label}
        name={valueName}
        onChange={(option) => {
          onUpdate(index, { ...condition, value: optionValue(option) })
        }}
        options={fieldOptions.map((opt) => ({ label: opt.label || opt.value, value: opt.value }))}
        path={valueName}
        placeholder="Select value..."
        value={currentValue}
      />
    )
  }

  if (selectedFieldType === 'number') {
    return (
      <TextInput
        label={label}
        onChange={(e: ChangeEvent<HTMLInputElement>) => {
          const numValue = e.target.value ? Number(e.target.value) : undefined
          onUpdate(index, { ...condition, value: numValue })
        }}
        path={valueName}
        placeholder="Enter number..."
        value={currentValue}
      />
    )
  }

  return (
    <TextInput
      label={label}
      onChange={(e: ChangeEvent<HTMLInputElement>) => {
        onUpdate(index, { ...condition, value: e.target.value })
      }}
      path={valueName}
      placeholder="Enter value..."
      value={currentValue}
    />
  )
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

      <ConditionValueInput
        condition={condition}
        fieldOptions={fieldOptions}
        index={index}
        onUpdate={onUpdate}
        selectedFieldType={selectedField?.type}
        showValueInput={showValueInput}
        valueName={valueName}
      />

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
