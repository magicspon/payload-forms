import { type VariantProps, cva } from 'class-variance-authority'
import * as React from 'react'
import styles from './Input.module.css'

const inputVariants = cva(styles.input, {
  variants: {
    measure: {
      default: '',
      xs: styles['input--xs'],
      sm: styles['input--sm'],
      lg: styles['input--lg'],
    },
  },
  defaultVariants: {
    measure: 'default',
  },
})

export type InputProps = React.ComponentProps<'input'> & VariantProps<typeof inputVariants>

function Input({ className, type, measure, ...props }: InputProps) {
  return (
    <input
      type={type}
      data-slot="input"
      className={inputVariants({ measure, className })}
      {...props}
    />
  )
}

export { Input }
