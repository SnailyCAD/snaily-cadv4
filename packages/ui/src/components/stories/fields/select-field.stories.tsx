import type { Meta, StoryObj } from "@storybook/react";
import { SelectField } from "../../fields/select-field";

const meta = {
  title: "Inputs/SelectField",
  component: SelectField,
  tags: ["autodocs"],
} satisfies Meta<typeof SelectField>;

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
    options: OPTIONS,
    selectedKey: "option-3",
  },
};

export const Disabled: Story = {
  args: {
    label: "Select an option",
    options: OPTIONS,
    isDisabled: true,
  },
};

export const MultiSelect: Story = {
  args: {
    label: "Select multiple options",
    options: OPTIONS,
    selectedKeys: ["option-3", "option-1"],
    selectionMode: "multiple",
  },
};
