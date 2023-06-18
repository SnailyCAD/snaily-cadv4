import type { Meta, StoryObj } from "@storybook/react";
import { ErrorMessage } from "../../error-message";

const meta = {
  title: "Helpers/ErrorMessage",
  component: ErrorMessage,
  tags: ["autodocs"],
} satisfies Meta<typeof ErrorMessage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    errorMessage: "Password must be at least 8 characters long.",
  },
};
