import type { Meta, StoryObj } from "@storybook/react";

import { Infofield } from "../../infofield";

const meta = {
  title: "Status/Infofield",
  component: Infofield,
  tags: ["autodocs"],
} satisfies Meta<typeof Infofield>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    label: "Full Name",
    children: "John doe",
  },
};
