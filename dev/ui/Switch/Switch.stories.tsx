import { faker } from '@faker-js/faker'
import type { Meta, StoryObj } from '@storybook/react'
import * as React from 'react'
import { Switch } from '.'

const meta = {
	title: 'ui/Switch',
	component: Switch,
	parameters: { layout: 'centered' },
	tags: ['autodocs'],
	argTypes: {
		size: { control: 'select', options: ['default', 'sm'] },
	},
} satisfies Meta<typeof Switch>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
	render: (args) => (
		<label
			style={{
				display: 'flex',
				alignItems: 'center',
				gap: '8px',
				cursor: 'pointer',
			}}
		>
			<Switch {...args} />
			<span>{faker.lorem.words(3)}</span>
		</label>
	),
}

export const Checked: Story = {
	args: { defaultChecked: true },
	render: (args) => (
		<label
			style={{
				display: 'flex',
				alignItems: 'center',
				gap: '8px',
				cursor: 'pointer',
			}}
		>
			<Switch {...args} />
			<span>{faker.lorem.words(3)}</span>
		</label>
	),
}

export const Small: Story = {
	args: { size: 'sm' },
	render: (args) => (
		<label
			style={{
				display: 'flex',
				alignItems: 'center',
				gap: '8px',
				cursor: 'pointer',
			}}
		>
			<Switch {...args} />
			<span>{faker.lorem.words(3)}</span>
		</label>
	),
}

export const Disabled: Story = {
	args: { disabled: true },
	render: (args) => (
		<label
			style={{
				display: 'flex',
				alignItems: 'center',
				gap: '8px',
				cursor: 'not-allowed',
			}}
		>
			<Switch {...args} />
			<span>{faker.lorem.words(3)}</span>
		</label>
	),
}
