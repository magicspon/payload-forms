'use client'
import { formOpts, useTypedAppFormContext } from '@forms/hooks/useForm'
import type { FieldRendererProps } from '@forms/types'
import { isVisible, makeValidator } from '@forms/utils'
import GroupField from '../../fields/GroupField'
import { RichText } from '@payloadcms/richtext-lexical/react'
import * as React from 'react'

export function FieldRenderer({ field, values, validatorCache, showHidden }: FieldRendererProps) {
  const form = useTypedAppFormContext(formOpts)
  if (!isVisible(field, values) && !showHidden) {
    return null
  }

  if (field.type === 'message') {
    if (!field.richText) {
      return null
    }
    return (
      <div className="prose">
        <RichText data={field.richText} />
      </div>
    )
  }

  const { name } = field
  const validator = makeValidator(field, validatorCache.get(name))

  if (field.type === 'radio') {
    return (
      <form.AppField name={name} validators={{ onBlur: validator }}>
        {(f) => <f.RadioField {...field} />}
      </form.AppField>
    )
  }

  if (field.type === 'checkbox') {
    return (
      <form.AppField name={name} validators={{ onBlur: validator }}>
        {(f) => <f.CheckboxField {...field} />}
      </form.AppField>
    )
  }

  if (field.type === 'toggle') {
    return (
      <form.AppField name={name} validators={{ onBlur: validator }}>
        {(f) => <f.ToggleField {...field} />}
      </form.AppField>
    )
  }

  if (field.type === 'consent') {
    return (
      <form.AppField name={name} validators={{ onBlur: validator }}>
        {(f) => <f.ConsentField {...field} />}
      </form.AppField>
    )
  }

  if (field.type === 'select') {
    return (
      <form.AppField name={name} validators={{ onBlur: validator }}>
        {(f) => <f.SelectField {...field} />}
      </form.AppField>
    )
  }

  if (field.type === 'textarea') {
    return (
      <form.AppField name={name} validators={{ onBlur: validator }}>
        {(f) => <f.TextareaField {...field} />}
      </form.AppField>
    )
  }

  if (field.type === 'file') {
    return (
      <form.AppField name={name} validators={{ onBlur: validator }}>
        {(f) => <f.FileField {...field} />}
      </form.AppField>
    )
  }

  if (field.type === 'date') {
    return (
      <form.AppField name={name} validators={{ onBlur: validator }}>
        {(f) => <f.DateField {...field} />}
      </form.AppField>
    )
  }

  if (field.type === 'array') {
    return (
      <form.AppField name={name} mode="array" validators={{ onBlur: validator }}>
        {(f) => <f.ArrayField {...field} />}
      </form.AppField>
    )
  }

  if (field.type === 'group') {
    return <GroupField {...field} />
  }

  // --- Text / Email / Number ---
  return (
    <form.AppField name={name} validators={{ onBlur: validator }}>
      {(f) => <f.TextField {...field} />}
    </form.AppField>
  )
}
