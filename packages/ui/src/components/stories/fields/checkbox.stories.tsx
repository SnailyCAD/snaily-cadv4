import type { Meta, StoryObj } from "@storybook/react";
import { CheckboxField } from "../../fields/checkbox-field";

const meta = {
  title: "Inputs/CheckboxField",
  component: CheckboxField,
  tags: ["autodocs"],
} satisfies Meta<typeof CheckboxField>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: "Unsubscribe",
  },
};

export const Indeterminate: Story = {
  args: {
    children: "Unsubscribe",
    isIndeterminate: true,
  },
};
