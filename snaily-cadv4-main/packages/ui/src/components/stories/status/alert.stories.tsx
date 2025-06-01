import type { Meta, StoryObj } from "@storybook/react";

import { Alert } from "../../alert/alert";

const meta = {
  title: "Status/Alert",
  component: Alert,
  tags: ["autodocs"],
} satisfies Meta<typeof Alert>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Success: Story = {
  args: {
    title: "User Settings",
    message: "Successfully updated your user settings.",
    type: "success",
  },
};

export const Warning: Story = {
  args: {
    title: "Select Live Map Server",
    message: "Please select a Live Map Server to continue.",
    type: "warning",
  },
};

export const Error: Story = {
  args: {
    title: "Failed to save",
    message: "We were unable to save your changes. Please try again.",
    type: "error",
  },
};
