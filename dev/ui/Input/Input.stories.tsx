import { faker } from '@faker-js/faker'
import type { Meta, StoryObj } from '@storybook/react'
import * as React from 'react'
import { Input } from '.'

const meta = {
	title: 'ui/Input',
	component: Input,
	parameters: { layout: 'centered' },
	tags: ['autodocs'],
} satisfies Meta<typeof Input>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
	args: {
		placeholder: faker.lorem.words(3),
	},
}

export const Email: Story = {
	args: {
		type: 'email',
		placeholder: faker.internet.email(),
	},
}

export const Password: Story = {
	args: {
		type: 'password',
		placeholder: 'Enter your password',
	},
}

export const WithValue: Story = {
	args: {
		defaultValue: faker.person.fullName(),
	},
}

export const Disabled: Story = {
	args: {
		disabled: true,
		defaultValue: faker.person.fullName(),
	},
}

export const Search: Story = {
	args: {
		type: 'search',
		placeholder: `Search ${faker.lorem.word()}s…`,
	},
}
