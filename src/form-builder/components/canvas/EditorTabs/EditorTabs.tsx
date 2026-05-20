import type { AllFields } from '@/shared/fieldSchema'
import type { ZodType } from 'zod'

import { ConditionsField, Divider } from '@/form-builder/components/shared/SharedFields'
import {
  type AnyFieldApi,
  EditorFormCtxProvider,
  EditorSettingsProvider,
} from '@/form-builder/context/EditorFormContext'
import { useSaveEditor } from '@/form-builder/hooks/useSaveEditor'
import { Inline } from '@/shared/layout'
import { camelCase } from '@/shared/utils/camelCase'
import { Button } from '@payloadcms/ui'

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
  const { contextValue, existingFieldNames, form, setSelectedField, submitHandle } = useSaveEditor({
    field,
    onChangeValidator,
  })

  return (
    <EditorFormCtxProvider value={contextValue}>
      <EditorSettingsProvider currentFieldId={field.id} existingFieldNames={existingFieldNames}>
        <div className={styles.grid}>
          {children}

          {!NO_CONDITIONS_TYPES.includes(field.type) && (
            <>
              <Divider />
              <h3 className={styles.sectionTitle}>Conditions</h3>
              <form.Field name="conditions">
                {(f) => <ConditionsField currentFieldId={field.id} field={f as AnyFieldApi} />}
              </form.Field>
            </>
          )}

          <Inline className={styles.actions}>
            <Button
              buttonStyle="secondary"
              extraButtonProps={{ 'data-testid': 'cancel-button' }}
              onClick={() => setSelectedField(null)}
            >
              Cancel
            </Button>
            <form.Subscribe
              selector={(state) => [state.canSubmit, state.isSubmitting, state.values] as const}
            >
              {([canSubmit, isSubmitting, values]) => {
                const label = 'label' in values ? (values as { label?: string }).label : undefined
                const name = 'name' in values ? (values as { name?: string }).name : undefined
                const effectiveName = name || camelCase(label ?? '')
                const hasDuplicateName = !!effectiveName && existingFieldNames.has(effectiveName)

                return (
                  <Button
                    extraButtonProps={{ 'data-testid': 'save-button' }}
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
