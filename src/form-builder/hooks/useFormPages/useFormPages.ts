import { buildFormSchema } from '@/form-builder/utils/buildFormSchema'
import { type FormPage, getAllFields } from '@/form-builder/utils/formTree'
import { useField } from '@payloadcms/ui'
import * as React from 'react'

export function useFormPages() {
  const { setValue: setPages, value: pages = [] } = useField<FormPage[]>({
    path: 'pages',
  })
  const { setValue: setFormSchema } = useField<Record<string, unknown>>({
    path: 'formSchema',
  })

  const updatePages = React.useCallback(
    (newPages: FormPage[]) => {
      setPages(newPages)
      const fields = getAllFields(newPages)
      setFormSchema(buildFormSchema({ fields }))
    },
    [setPages, setFormSchema],
  )

  return { pages, setPages: updatePages }
}
