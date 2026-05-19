'use client'

import { Input } from '@ui/primitives/Input'
import { Textarea } from '@ui/primitives/Textarea'
import { cn } from '@ui/utils/cn'
import * as React from 'react'
import styles from './InputGroup.module.css'

type Align = 'inline-start' | 'inline-end' | 'block-start' | 'block-end'
type ButtonSize = 'xs' | 'sm' | 'icon-xs' | 'icon-sm'

function InputGroup({ className, ...props }: React.ComponentProps<'div'>) {
	return (
		<div
			data-slot="input-group"
			role="group"
			className={cn(styles.inputGroup, className)}
			{...props}
		/>
	)
}

function InputGroupAddon({
	className,
	align = 'inline-start',
	...props
}: React.ComponentProps<'div'> & { align?: Align }) {
	return (
		<div
			role="group"
			data-slot="input-group-addon"
			data-align={align}
			className={cn(styles.addon, className)}
			onClick={(e) => {
				// React portal events bubble through the React tree, not the DOM tree.
				// Without this guard, clicking inside a portal rendered within this
				// addon (e.g. a calendar popover) would bubble here and re-focus the
				// input, because the portal target is not a DOM descendant of this node.
				if (!e.currentTarget.contains(e.target as Node)) {
					return
				}
				if ((e.target as HTMLElement).closest('button')) {
					return
				}
				e.currentTarget.parentElement?.querySelector('input')?.focus()
			}}
			{...props}
		/>
	)
}

function InputGroupButton({
	className,
	type = 'button',
	size = 'xs',
	...props
}: React.ComponentProps<'button'> & { size?: ButtonSize }) {
	return (
		<button
			type={type}
			data-size={size}
			className={cn(styles.button, className)}
			{...props}
		/>
	)
}

function InputGroupText({ className, ...props }: React.ComponentProps<'span'>) {
	return <span className={cn(styles.text, className)} {...props} />
}

function InputGroupInput({
	className,
	...props
}: React.ComponentProps<'input'>) {
	return (
		<Input
			data-slot="input-group-control"
			className={cn(styles.input, className)}
			{...props}
		/>
	)
}

function InputGroupTextarea({
	className,
	...props
}: React.ComponentProps<'textarea'>) {
	return (
		<Textarea
			data-slot="input-group-control"
			className={cn(styles.textarea, className)}
			{...props}
		/>
	)
}

export {
	InputGroup,
	InputGroupAddon,
	InputGroupButton,
	InputGroupText,
	InputGroupInput,
	InputGroupTextarea,
}
