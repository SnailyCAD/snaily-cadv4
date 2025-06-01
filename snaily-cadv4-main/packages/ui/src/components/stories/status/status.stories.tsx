import type { Meta, StoryObj } from "@storybook/react";
import { Status, colors } from "../../status";

const meta = {
  title: "Status/Status",
  component: Status,
  tags: ["autodocs"],
  argTypes: {
    children: {
      options: Object.keys(colors),
      control: {
        type: "select",
      },
    },
  },
} satisfies Meta<typeof Status>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Green: Story = {
  args: {
    children: "ACCEPTED",
  },
};

export const Red: Story = {
  args: {
    children: "DECLINED",
  },
};

export const Amber: Story = {
  args: {
    children: "IN_PROGRESS",
  },
};

export const WithFallback: Story = {
  args: {
    children: null,
    fallback: "-",
  },
};
