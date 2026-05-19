import { faker } from '@faker-js/faker'
import type { Meta, StoryObj } from '@storybook/react'
import { Lock, Mail, Search } from 'lucide-react'
import * as React from 'react'
import {
	InputGroup,
	InputGroupAddon,
	InputGroupButton,
	InputGroupInput,
	InputGroupText,
	InputGroupTextarea,
} from '.'

const meta = {
	title: 'ui/InputGroup',
	component: InputGroup,
	parameters: { layout: 'centered' },
	tags: ['autodocs'],
} satisfies Meta<typeof InputGroup>

export default meta
type Story = StoryObj<typeof meta>

export const WithLeadingText: Story = {
	render: () => (
		<InputGroup style={{ width: '320px' }}>
			<InputGroupAddon align="inline-start">
				<InputGroupText>https://</InputGroupText>
			</InputGroupAddon>
			<InputGroupInput placeholder={faker.internet.domainName()} />
		</InputGroup>
	),
}

export const WithTrailingButton: Story = {
	render: () => (
		<InputGroup style={{ width: '320px' }}>
			<InputGroupInput
				type="search"
				placeholder={`Search ${faker.lorem.word()}s…`}
			/>
			<InputGroupAddon align="inline-end">
				<InputGroupButton aria-label="Search">
					<Search size={16} />
				</InputGroupButton>
			</InputGroupAddon>
		</InputGroup>
	),
}

export const WithLeadingIcon: Story = {
	render: () => (
		<InputGroup style={{ width: '320px' }}>
			<InputGroupAddon align="inline-start">
				<InputGroupButton aria-label="Email">
					<Mail size={16} />
				</InputGroupButton>
			</InputGroupAddon>
			<InputGroupInput type="email" placeholder={faker.internet.email()} />
		</InputGroup>
	),
}

export const WithBothAddons: Story = {
	render: () => (
		<InputGroup style={{ width: '320px' }}>
			<InputGroupAddon align="inline-start">
				<InputGroupText>£</InputGroupText>
			</InputGroupAddon>
			<InputGroupInput type="number" placeholder="0.00" />
			<InputGroupAddon align="inline-end">
				<InputGroupText>GBP</InputGroupText>
			</InputGroupAddon>
		</InputGroup>
	),
}

export const WithPasswordToggle: Story = {
	render: () => (
		<InputGroup style={{ width: '320px' }}>
			<InputGroupAddon align="inline-start">
				<InputGroupButton aria-label="Password">
					<Lock size={16} />
				</InputGroupButton>
			</InputGroupAddon>
			<InputGroupInput type="password" placeholder="Enter password" />
		</InputGroup>
	),
}

export const WithTextarea: Story = {
	render: () => (
		<InputGroup style={{ width: '320px' }}>
			<InputGroupAddon align="block-start">
				<InputGroupText>Note</InputGroupText>
			</InputGroupAddon>
			<InputGroupTextarea placeholder={faker.lorem.sentence()} rows={4} />
		</InputGroup>
	),
}
