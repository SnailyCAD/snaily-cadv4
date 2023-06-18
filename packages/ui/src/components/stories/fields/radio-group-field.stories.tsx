import type { Meta, StoryObj } from "@storybook/react";
import { RadioGroupField, Radio } from "../../fields/radio-group-field";

const meta = {
  title: "Inputs/RadioGroupField",
  component: RadioGroupField,
  tags: ["autodocs"],
} satisfies Meta<typeof RadioGroupField>;

export default meta;
type Story = StoryObj<typeof meta>;

const OPTIONS = [
  {
    label: "Option 1",
    value: "option-1",
  },
  {
    label: "Option 2",
    value: "option-2",
  },
  {
    label: "Option 3",
    value: "option-3",
  },
];

export const Default: Story = {
  args: {
    label: "Select an option",
    children: OPTIONS.map((option) => (
      <Radio key={option.value} value={option.value}>
        {option.label}
      </Radio>
    )),
  },
};

export const Disabled: Story = {
  args: {
    isDisabled: true,
    label: "Select an option",
    children: OPTIONS.map((option) => (
      <Radio key={option.value} value={option.value}>
        {option.label}
      </Radio>
    )),
  },
};
