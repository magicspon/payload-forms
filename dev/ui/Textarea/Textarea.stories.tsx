import { faker } from '@faker-js/faker'
import type { Meta, StoryObj } from '@storybook/react'
import * as React from 'react'
import { Textarea } from '.'

const meta = {
	title: 'ui/Textarea',
	component: Textarea,
	parameters: { layout: 'centered' },
	tags: ['autodocs'],
} satisfies Meta<typeof Textarea>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
	args: {
		placeholder: faker.lorem.sentence(),
	},
}

export const WithValue: Story = {
	args: {
		defaultValue: faker.lorem.paragraph(),
		rows: 5,
	},
}

export const Disabled: Story = {
	args: {
		disabled: true,
		defaultValue: faker.lorem.paragraph(),
		rows: 4,
	},
}
