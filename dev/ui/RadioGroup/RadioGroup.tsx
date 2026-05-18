import { cn } from '@ui/utils/cn'
import * as React from 'react'
import styles from './RadioGroup.module.css'

function RadioGroup({ className, ...props }: React.ComponentProps<'div'>) {
	return (
		<div
			role="radiogroup"
			data-slot="radio-group"
			className={cn(styles.group, className)}
			{...props}
		/>
	)
}

function RadioGroupItem({
	className,
	...props
}: React.ComponentProps<'input'>) {
	return (
		<input
			type="radio"
			data-slot="radio-group-item"
			className={cn(styles.item, className)}
			{...props}
		/>
	)
}

export { RadioGroup, RadioGroupItem }
