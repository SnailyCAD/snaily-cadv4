import type { Meta, StoryObj } from "@storybook/react";
import { DatePickerField } from "../../fields/date-picker-field";

const meta = {
  title: "Inputs/DatePickerField",
  component: DatePickerField,
  tags: ["autodocs"],
} satisfies Meta<typeof DatePickerField>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    label: "Appointment Date",
    value: new Date("2023-03-15"),
  },
};
