'use client'

import * as React from 'react'

import styles from './layout.module.css'

type DivProps = React.ComponentProps<'div'>

export function Stack({ className = '', ...props }: DivProps) {
  return <div className={`${styles.stack} ${className}`} {...props} />
}

export function Inline({ className = '', ...props }: DivProps) {
  return <div className={`${styles.inline} ${className}`} {...props} />
}
