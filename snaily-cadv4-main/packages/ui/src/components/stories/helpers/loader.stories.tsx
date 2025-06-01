import type { Meta, StoryObj } from "@storybook/react";
import { Loader } from "../../loader";

const meta = {
  title: "Helpers/Loader",
  component: Loader,
  tags: ["autodocs"],
} satisfies Meta<typeof Loader>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {},
};
