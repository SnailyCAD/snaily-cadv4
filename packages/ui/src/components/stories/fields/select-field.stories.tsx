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

const OPTIONS_WITH_DESC = OPTIONS.map((option) => ({
  ...option,
  description: "This is a description",
}));

const LARGE_LIST = Array.from({ length: 30 })
  .fill({})
  .map((_, i) => ({
    label: `Option ${i}`,
    value: `option-${i}`,
  }));

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

export const MultiSelectLargeList: Story = {
  args: {
    label: "Select multiple options",
    options: LARGE_LIST,
    selectedKeys: LARGE_LIST.slice(5, 30).map((o) => o.value),
    selectionMode: "multiple",
  },
};

export const MultiWithDescription: Story = {
  args: {
    label: "Select multiple options",
    options: OPTIONS_WITH_DESC,
    selectedKeys: OPTIONS_WITH_DESC.map((v) => v.value),
    selectionMode: "multiple",
  },
};
