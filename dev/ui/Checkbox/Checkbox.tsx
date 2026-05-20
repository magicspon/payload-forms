'use client'

import { cn } from '@ui/utils/cn'
import * as React from 'react'
import styles from './Checkbox.module.css'

function Checkbox({ className, ...props }: React.ComponentProps<'input'>) {
  return (
    <input
      type="checkbox"
      data-slot="checkbox"
      className={cn(styles.checkbox, className)}
      {...props}
    />
  )
}

export { Checkbox }
