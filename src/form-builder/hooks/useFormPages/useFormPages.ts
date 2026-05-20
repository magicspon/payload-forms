import { buildFormSchema } from '@/form-builder/utils/buildFormSchema'
import { type FormPage, getAllFields } from '@/form-builder/utils/formTree'
import { nanoid } from '@/shared/utils/nanoid'
import { useField } from '@payloadcms/ui'
import * as React from 'react'

const DEFAULT_PAGE: FormPage = {
  id: nanoid(),
  backButton: 'Back',
  nextButton: 'Next',
  rows: [{ id: nanoid(), columns: [] }],
  title: 'Page 1',
}

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

  // Seed a default page on the client when the field starts empty (new forms).
  // A ref guards against re-initialising on subsequent renders.
  const initialised = React.useRef(false)
  React.useEffect(() => {
    if (!initialised.current && pages.length === 0) {
      initialised.current = true
      updatePages([{ ...DEFAULT_PAGE, id: nanoid(), rows: [{ id: nanoid(), columns: [] }] }])
    }
  }, [pages.length, updatePages])

  return { pages, setPages: updatePages }
}
