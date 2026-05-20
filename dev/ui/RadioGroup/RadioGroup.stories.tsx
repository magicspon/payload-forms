import { faker } from '@faker-js/faker'
import type { Meta, StoryObj } from '@storybook/react'
import * as React from 'react'
import { RadioGroup, RadioGroupItem } from '.'

const meta = {
  title: 'ui/RadioGroup',
  component: RadioGroup,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
} satisfies Meta<typeof RadioGroup>

export default meta
type Story = StoryObj<typeof meta>

const options = (prefix: string) =>
  Array.from({ length: 4 }, () => ({
    id: `${prefix}:${faker.string.uuid()}`,
    value: faker.lorem.word(),
    label: faker.lorem.words(3),
  }))

export const Default: Story = {
  render: () => (
    <RadioGroup style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {options('default').map(({ id, value, label }) => (
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
          <RadioGroupItem id={id} value={value} name="default" />
          <span>{label}</span>
        </label>
      ))}
    </RadioGroup>
  ),
}

export const WithDefaultSelected: Story = {
  render: () => (
    <RadioGroup style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {options('with-default-selected').map(({ id, value, label }, i) => (
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
          <RadioGroupItem
            id={id}
            value={value}
            name="with-default-selected"
            defaultChecked={i === 0}
          />
          <span>{label}</span>
        </label>
      ))}
    </RadioGroup>
  ),
}
