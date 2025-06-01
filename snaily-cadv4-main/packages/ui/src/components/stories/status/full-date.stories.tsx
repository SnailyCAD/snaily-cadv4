import type { Meta, StoryObj } from "@storybook/react";

import { FullDate } from "../../full-date";

const meta = {
  title: "Status/FullDate",
  component: FullDate,
  tags: ["autodocs"],
} satisfies Meta<typeof FullDate>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: new Date("2022-03-20 12:00:00").getTime(),
  },
};

export const Relative: Story = {
  args: {
    children: new Date("2022-03-20 12:00:00").getTime(),
    relative: true,
  },
};

export const OnlyShowTheDate: Story = {
  args: {
    children: new Date("2000-03-20 12:00:00").getTime(),
    onlyDate: true,
  },
};
