import type { ZodType } from 'zod'

import { useSaveEditor } from '@/form-builder/hooks/useSaveEditor'
import {
	type AnyFieldApi,
	EditorFormCtxProvider,
	EditorSettingsProvider,
} from '@/shared/context/EditorFormContext'
import { Inline } from '@/shared/ui/layout'
import { camelCase } from '@/shared/utils/camelCase'
import { Button } from '@payloadcms/ui'

import type { AllFields } from '../../../fieldSchema'

import { ConditionsField } from '../../fields/SharedFields'
import styles from './EditorTabs.module.css'

type EditorTabsProps<U extends AllFields> = {
	children: React.ReactNode
	field: U
	onChangeValidator: ZodType<U>
}

const NO_CONDITIONS_TYPES = ['array']

export function EditorTabs<U extends AllFields>({
	children,
	field,
	onChangeValidator,
}: EditorTabsProps<U>) {
	const { contextValue, existingFieldNames, form, setSelectedField, submitHandle } =
		useSaveEditor({
			field,
			onChangeValidator,
		})

	return (
		<EditorFormCtxProvider value={contextValue}>
			<EditorSettingsProvider
				currentFieldId={field.id}
				existingFieldNames={existingFieldNames}
			>
				<div className={styles.grid}>
					{children}

					{!NO_CONDITIONS_TYPES.includes(field.type) && (
						<>
							<hr className={styles.divider} />
							<h3 className={styles.sectionTitle}>
								Conditions
							</h3>
							<form.Field name="conditions">
								{(f) => (
									<ConditionsField currentFieldId={field.id} field={f as AnyFieldApi} />
								)}
							</form.Field>
						</>
					)}

					<Inline className={styles.actions}>
						<Button
							buttonStyle="secondary"
							data-testid="cancel-button"
							onClick={() => setSelectedField(null)}
						>
							Cancel
						</Button>
						<form.Subscribe
							selector={(state) => [
								state.canSubmit,
								state.isSubmitting,
								state.values,
							]}
						>
							{([canSubmit, isSubmitting, values]) => {
								const typedValues = values as { label?: string; name?: string }
								const effectiveName =
									typedValues.name || camelCase(typedValues.label ?? '')
								const hasDuplicateName =
									!!effectiveName && existingFieldNames.has(effectiveName)

								return (
									<Button
										data-testid="save-button"
										disabled={!canSubmit || !!isSubmitting || hasDuplicateName}
										onClick={submitHandle}
										type="button"
									>
										{isSubmitting ? 'Saving...' : 'Save'}
									</Button>
								)
							}}
						</form.Subscribe>
					</Inline>
				</div>
			</EditorSettingsProvider>
		</EditorFormCtxProvider>
	)
}
