'use client'
import { cn } from '@ui/utils/cn'
import * as React from 'react'
import styles from './Switch.module.css'

interface SwitchProps {
	checked?: boolean
	onCheckedChange?: (checked: boolean) => void
	id?: string
	disabled?: boolean
	className?: string
	size?: 'sm' | 'default'
}

function Switch({ className, size = 'default', checked, onCheckedChange, id, disabled }: SwitchProps) {
	return (
		<button
			role="switch"
			type="button"
			id={id}
			data-slot="switch"
			data-size={size}
			aria-checked={checked}
			disabled={disabled}
			className={cn(styles.root, className)}
			onClick={() => onCheckedChange?.(!checked)}
		>
			<span data-slot="switch-thumb" className={styles.thumb} />
		</button>
	)
}

export { Switch }
