import type {
	Condition,
	ConditionOperator,
	FieldConditions,
} from '../fieldSchema'

/**
 * Evaluate a single condition against submission data.
 *
 * @param previousData - Previous submission data, required for hasChanged /
 *   hasNotChanged operators. When omitted, previousData defaults to an empty
 *   object, meaning any field with a current value will appear as "changed".
 */
function evaluateCondition(
	condition: Condition,
	submissionData: Record<string, unknown>,
	previousData?: Record<string, unknown>,
): boolean {
	const fieldValue = submissionData[condition.field]
	const conditionValue = condition.value

	if (condition.operator === 'hasChanged') {
		const prev = String((previousData?.[condition.field] as bigint | boolean | number | string | undefined) ?? '')
		const curr = String((submissionData[condition.field] as bigint | boolean | number | string | undefined) ?? '')
		return prev !== curr
	}

	if (condition.operator === 'hasNotChanged') {
		const prev = String((previousData?.[condition.field] as bigint | boolean | number | string | undefined) ?? '')
		const curr = String((submissionData[condition.field] as bigint | boolean | number | string | undefined) ?? '')
		return prev === curr
	}

	if (condition.operator === 'isEmpty') {
		return (
			fieldValue === undefined ||
			fieldValue === null ||
			fieldValue === '' ||
			(Array.isArray(fieldValue) && fieldValue.length === 0)
		)
	}

	if (condition.operator === 'isNotEmpty') {
		return (
			fieldValue !== undefined &&
			fieldValue !== null &&
			fieldValue !== '' &&
			!(Array.isArray(fieldValue) && fieldValue.length === 0)
		)
	}

	const compareValues = (
		a: unknown,
		b: unknown,
		operator: ConditionOperator,
	): boolean => {
		if (Array.isArray(a)) {
			if (operator === 'equals') {return a.includes(b)}
			if (operator === 'notEquals') {return !a.includes(b)}
			if (operator === 'contains') {
				return a.some(
					(item) =>
						typeof item === 'string' &&
						typeof b === 'string' &&
						item.toLowerCase().includes(b.toLowerCase()),
				)
			}
			return false
		}

		if (typeof a === 'string' && typeof b === 'string') {
			switch (operator) {
				case 'contains':
					return a.toLowerCase().includes(b.toLowerCase())
				case 'equals':
					return a === b
				case 'notEquals':
					return a !== b
				default:
					return false
			}
		}

		const numA = Number(a)
		const numB = Number(b)
		if (!Number.isNaN(numA) && !Number.isNaN(numB)) {
			switch (operator) {
				case 'equals':
					return numA === numB
				case 'greaterThan':
					return numA > numB
				case 'greaterThanOrEquals':
					return numA >= numB
				case 'lessThan':
					return numA < numB
				case 'lessThanOrEquals':
					return numA <= numB
				case 'notEquals':
					return numA !== numB
				default:
					return false
			}
		}

		return operator === 'equals'
			? String(a) === String(b)
			: String(a) !== String(b)
	}

	return compareValues(fieldValue, conditionValue, condition.operator)
}

/**
 * Evaluate all conditions to determine if a notification should be sent.
 * No conditions → always send.
 *
 * @param previousData - Previous submission data. Required when conditions
 *   include hasChanged / hasNotChanged operators (e.g. for field_changed triggers).
 */
export function shouldSendNotification(
	conditions: FieldConditions | null | undefined,
	submissionData: Record<string, unknown>,
	previousData?: Record<string, unknown>,
): boolean {
	if (
		!conditions ||
		!conditions.conditions ||
		conditions.conditions.length === 0
	) {
		return true
	}

	const results = conditions.conditions.map((condition) =>
		evaluateCondition(condition, submissionData, previousData),
	)

	if (conditions.logic === 'and') {
		return results.every(Boolean)
	}

	return results.some(Boolean)
}
