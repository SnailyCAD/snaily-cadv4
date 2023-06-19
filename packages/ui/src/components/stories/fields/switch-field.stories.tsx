import type { Meta, StoryObj } from "@storybook/react";
import { SwitchField } from "../../fields/switch-field";

const meta = {
  title: "Inputs/SwitchField",
  component: SwitchField,
  tags: ["autodocs"],
} satisfies Meta<typeof SwitchField>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: "Dark Mode",
  },
};

export const Disabled: Story = {
  args: {
    children: "Dark Mode",
    isDisabled: true,
  },
};

export const HiddenLabel: Story = {
  args: {
    "aria-label": "Add helpful label here",
  },
};
