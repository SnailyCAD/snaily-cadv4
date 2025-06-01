import type { Meta, StoryObj } from "@storybook/react";
import { TextField } from "../../fields/text-field";

const meta = {
  title: "Inputs/TextField",
  component: TextField,
  tags: ["autodocs"],
} satisfies Meta<typeof TextField>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    label: "Username",
    placeholder: "Enter your username",
  },
};

export const Disabled: Story = {
  args: {
    label: "Username",
    placeholder: "Enter your username",
    isDisabled: true,
  },
};

export const Optional: Story = {
  args: {
    label: "Username",
    placeholder: "Enter your username",
    isOptional: true,
  },
};

export const WithDescription: Story = {
  args: {
    label: "Username",
    placeholder: "Enter your username",
    description: "This is a description inside a hover-card",
  },
};

export const TextFieldTextArea: Story = {
  args: {
    label: "Username",
    placeholder: "Enter your username",
    isTextarea: true,
  },
};
