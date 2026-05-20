'use client'

import { FormFieldsProvider } from '@/form-builder/context/FormFieldsContext'
import * as React from 'react'

export function FormBuilderProvider({ children }: { children: React.ReactNode }) {
  return <FormFieldsProvider>{children}</FormFieldsProvider>
}
