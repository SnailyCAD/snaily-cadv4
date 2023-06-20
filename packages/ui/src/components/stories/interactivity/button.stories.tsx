import type { Meta, StoryObj } from "@storybook/react";

import { Button } from "../../button/button";

const meta = {
  title: "Interactivity/Button",
  component: Button,
  tags: ["autodocs"],
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    variant: "default",
    size: "sm",
    children: "Button",
  },
};

export const Success: Story = {
  args: {
    variant: "success",
    children: "Success Button",
  },
};

export const Large: Story = {
  args: {
    variant: "default",
    size: "lg",
    children: "Button",
  },
};

export const Small: Story = {
  args: {
    variant: "danger",
    size: "xs",
    children: "Button",
  },
};
