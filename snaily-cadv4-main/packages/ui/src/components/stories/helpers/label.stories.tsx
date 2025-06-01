import type { Meta, StoryObj } from "@storybook/react";
import { Label } from "../../label";

const meta = {
  title: "Helpers/Label",
  component: Label,
  tags: ["autodocs"],
} satisfies Meta<typeof Label>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    label: "Password",
    labelProps: {},
  },
};

export const Optional: Story = {
  args: {
    label: "Email",
    labelProps: {},
    isOptional: true,
  },
};

export const Description: Story = {
  args: {
    label: "Email",
    labelProps: {},
    description: "We will never share your email with anyone else.",
  },
};
