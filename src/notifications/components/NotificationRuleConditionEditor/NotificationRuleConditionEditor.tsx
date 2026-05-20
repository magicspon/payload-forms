'use client'

import type { JSONFieldClientProps } from 'payload'
import type { ChangeEvent } from 'react'

import { type FormPage, getAllFields } from '@/form-builder/utils/formTree'
import {
  type Condition,
  type ConditionOperator,
  conditionOperators,
  type Field,
  type FieldConditions,
} from '@/shared/fieldSchema'
import { Stack } from '@/shared/layout'
import {
  Button,
  PlusIcon,
  SelectInput,
  TextInput,
  useConfig,
  useField,
  XIcon,
} from '@payloadcms/ui'
import { useEffect, useState } from 'react'

import styles from './NotificationRuleConditionEditor.module.css'

type NotificationRuleConditionEditorProps = JSONFieldClientProps

function getOperatorsForFieldType(fieldType: Field['type'] | undefined) {
  const numericOperators = ['greaterThan', 'lessThan', 'greaterThanOrEquals', 'lessThanOrEquals']
  if (fieldType === 'number') {
    return conditionOperators
  }
  return conditionOperators.filter((op) => !numericOperators.includes(op.value))
}

function operatorRequiresValue(operator: ConditionOperator): boolean {
  return (
    operator !== 'isEmpty' &&
    operator !== 'isNotEmpty' &&
    operator !== 'hasChanged' &&
    operator !== 'hasNotChanged'
  )
}

type ConditionRowProps = {
  availableFields: Field[]
  condition: Condition
  index: number
  onRemove: (index: number) => void
  onUpdate: (index: number, condition: Condition) => void
}

function ConditionRow({
  availableFields,
  condition,
  index,
  onRemove,
  onUpdate,
}: ConditionRowProps) {
  const selectedField = availableFields.find(
    (f) => f.type !== 'message' && f.name === condition.field,
  )
  const operators = getOperatorsForFieldType(selectedField?.type)
  const showValueInput = operatorRequiresValue(condition.operator)
  const fieldOptions = selectedField && 'options' in selectedField ? selectedField.options : null

  return (
    <div className={styles.conditionRow}>
      <SelectInput
        label={index === 0 ? 'Field' : undefined}
        name={`notif-rule-condition-field-${index}`}
        onChange={(option) => {
          const value = option ? (option as { value: string }).value : ''
          onUpdate(index, { ...condition, field: value, value: undefined })
        }}
        options={availableFields
          .filter((f) => f.type !== 'message')
          .map((f) => ({ label: f.label || f.name, value: f.name }))}
        path={`notif-rule-condition-field-${index}`}
        placeholder="Select field..."
        value={condition.field}
      />

      <SelectInput
        label={index === 0 ? 'Condition' : undefined}
        name={`notif-rule-condition-operator-${index}`}
        onChange={(option) => {
          const op = option ? ((option as { value: string }).value as ConditionOperator) : 'equals'
          const next: Condition = { ...condition, operator: op }
          if (!operatorRequiresValue(op)) {
            delete next.value
          }
          onUpdate(index, next)
        }}
        options={operators.map((op) => ({ label: op.label, value: op.value }))}
        path={`notif-rule-condition-operator-${index}`}
        value={condition.operator}
      />

      {showValueInput ? (
        fieldOptions ? (
          <SelectInput
            isClearable
            label={index === 0 ? 'Value' : undefined}
            name={`notif-rule-condition-value-${index}`}
            onChange={(option) => {
              const value = option ? (option as { value: string }).value : ''
              onUpdate(index, { ...condition, value })
            }}
            options={fieldOptions.map((opt) => ({
              label: opt.label || opt.value,
              value: opt.value,
            }))}
            path={`notif-rule-condition-value-${index}`}
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
            path={`notif-rule-condition-value-${index}`}
            placeholder="Enter number..."
            value={String(condition.value ?? '')}
          />
        ) : (
          <TextInput
            label={index === 0 ? 'Value' : undefined}
            onChange={(e: ChangeEvent<HTMLInputElement>) => {
              onUpdate(index, { ...condition, value: e.target.value })
            }}
            path={`notif-rule-condition-value-${index}`}
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

export function NotificationRuleConditionEditor({ path }: NotificationRuleConditionEditorProps) {
  const { config } = useConfig()
  const serverURL = config.serverURL

  const { value: formValue } = useField<{ id: string } | null | string>({
    path: 'form',
  })

  const { setValue: setConditions, value: conditions } = useField<FieldConditions | null>({ path })

  const [availableFields, setAvailableFields] = useState<Field[]>([])
  const [loading, setLoading] = useState(false)

  const formId = formValue && typeof formValue === 'object' ? formValue.id : formValue

  useEffect(() => {
    if (!formId) {
      setAvailableFields([])
      return
    }

    setLoading(true)

    fetch(`${serverURL}/api/forms/${formId}?depth=0`, {
      credentials: 'include',
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { pages?: FormPage[] } | null) => {
        const pages = data?.pages ?? []
        setAvailableFields(getAllFields(pages).filter((f) => f.type !== 'message'))
      })
      .catch(() => setAvailableFields([]))
      .finally(() => setLoading(false))
  }, [formId, serverURL])

  const conditionsList = conditions?.conditions ?? []
  const logic = conditions?.logic ?? 'and'

  const updateConditions = (newConditions: Condition[], newLogic?: 'and' | 'or') => {
    if (newConditions.length === 0) {
      setConditions(null)
    } else {
      setConditions({ conditions: newConditions, logic: newLogic ?? logic })
    }
  }

  const addCondition = () => {
    updateConditions([...conditionsList, { field: '', operator: 'equals', value: '' }])
  }

  const updateCondition = (index: number, condition: Condition) => {
    const next = [...conditionsList]
    next[index] = condition
    updateConditions(next)
  }

  const removeCondition = (index: number) => {
    updateConditions(conditionsList.filter((_, i) => i !== index))
  }

  const toggleLogic = () => {
    updateConditions(conditionsList, logic === 'and' ? 'or' : 'and')
  }

  if (!formId) {
    return (
      <div className={styles.emptyState}>
        <p className={styles.emptyText}>Select a form above to configure field conditions</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className={styles.emptyState}>
        <p className={styles.emptyText}>Loading form fields…</p>
      </div>
    )
  }

  if (availableFields.length === 0) {
    return (
      <div className={styles.emptyState}>
        <p className={styles.emptyText}>No fields found on the selected form</p>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <p className={styles.headerLabel}>Send Conditions</p>
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
                availableFields={availableFields}
                condition={condition}
                index={index}
                onRemove={removeCondition}
                onUpdate={updateCondition}
              />
            </div>
          ))}
        </Stack>
      ) : (
        <p className={styles.noConditionsText}>
          No conditions set. This notification fires whenever the trigger event occurs.
        </p>
      )}

      <Button className={styles.addButton} onClick={addCondition} type="button">
        <PlusIcon />
        Add Condition
      </Button>
    </div>
  )
}
