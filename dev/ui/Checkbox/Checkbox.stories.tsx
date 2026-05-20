import { faker } from '@faker-js/faker'
import type { Meta, StoryObj } from '@storybook/react'
import * as React from 'react'
import { Checkbox } from '.'

const meta = {
  title: 'ui/Checkbox',
  component: Checkbox,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
} satisfies Meta<typeof Checkbox>

export default meta
type Story = StoryObj<typeof meta>

const options = Array.from({ length: 3 }, () => ({
  id: faker.string.uuid(),
  label: faker.lorem.words(2),
}))

export const Default: Story = {
  args: {
    id: 'default-checkbox',
    name: 'default',
  },
  render: (args) => (
    <label
      htmlFor={args.id}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        cursor: 'pointer',
      }}
    >
      <Checkbox {...args} />
      <span>{faker.lorem.words(3)}</span>
    </label>
  ),
}

export const Checked: Story = {
  args: {
    id: 'checked-checkbox',
    name: 'checked',
    defaultChecked: true,
  },
  render: (args) => (
    <label
      htmlFor={args.id}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        cursor: 'pointer',
      }}
    >
      <Checkbox {...args} />
      <span>{faker.lorem.words(3)}</span>
    </label>
  ),
}

export const Disabled: Story = {
  args: {
    id: 'disabled-checkbox',
    name: 'disabled',
    disabled: true,
  },
  render: (args) => (
    <label
      htmlFor={args.id}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        cursor: 'not-allowed',
      }}
    >
      <Checkbox {...args} />
      <span>{faker.lorem.words(3)}</span>
    </label>
  ),
}

export const Group: Story = {
  render: () => (
    <fieldset
      style={{
        border: 'none',
        padding: 0,
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
      }}
    >
      <legend style={{ marginBottom: '8px', fontWeight: 600 }}>{faker.lorem.words(2)}</legend>
      {options.map(({ id, label }) => (
        <label
          key={id}
          htmlFor={id}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            cursor: 'pointer',
          }}
        >
          <Checkbox id={id} name="group" value={id} />
          <span>{label}</span>
        </label>
      ))}
    </fieldset>
  ),
}
