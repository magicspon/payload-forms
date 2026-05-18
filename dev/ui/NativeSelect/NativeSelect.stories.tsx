import { faker } from '@faker-js/faker'
import type { Meta, StoryObj } from '@storybook/react'
import * as React from 'react'
import { NativeSelect, NativeSelectOptGroup, NativeSelectOption } from '.'

const meta = {
	title: 'ui/NativeSelect',
	component: NativeSelect,
	parameters: { layout: 'centered' },
	tags: ['autodocs'],
	argTypes: {
		size: { control: 'select', options: ['default', 'sm'] },
	},
} satisfies Meta<typeof NativeSelect>

export default meta
type Story = StoryObj<typeof meta>

const departments = Array.from({ length: 5 }, () => ({
	value: faker.string.uuid(),
	label: faker.commerce.department(),
}))

const grouped = {
	fruits: Array.from({ length: 3 }, () => faker.food.fruit()),
	vegetables: Array.from({ length: 3 }, () => faker.food.vegetable()),
}

export const Default: Story = {
	render: (args) => (
		<NativeSelect {...args}>
			<NativeSelectOption value="">Select a department…</NativeSelectOption>
			{departments.map(({ value, label }) => (
				<NativeSelectOption key={value} value={value}>
					{label}
				</NativeSelectOption>
			))}
		</NativeSelect>
	),
}

export const Small: Story = {
	args: { size: 'sm' },
	render: (args) => (
		<NativeSelect {...args}>
			<NativeSelectOption value="">Select…</NativeSelectOption>
			{departments.map(({ value, label }) => (
				<NativeSelectOption key={value} value={value}>
					{label}
				</NativeSelectOption>
			))}
		</NativeSelect>
	),
}

export const WithOptGroups: Story = {
	render: (args) => (
		<NativeSelect {...args}>
			<NativeSelectOption value="">Select food…</NativeSelectOption>
			<NativeSelectOptGroup label="Fruits">
				{grouped.fruits.map((fruit) => (
					<NativeSelectOption key={fruit} value={fruit}>
						{fruit}
					</NativeSelectOption>
				))}
			</NativeSelectOptGroup>
			<NativeSelectOptGroup label="Vegetables">
				{grouped.vegetables.map((veg) => (
					<NativeSelectOption key={veg} value={veg}>
						{veg}
					</NativeSelectOption>
				))}
			</NativeSelectOptGroup>
		</NativeSelect>
	),
}

export const Disabled: Story = {
	args: { disabled: true },
	render: (args) => (
		<NativeSelect {...args}>
			<NativeSelectOption value="">Unavailable</NativeSelectOption>
		</NativeSelect>
	),
}
