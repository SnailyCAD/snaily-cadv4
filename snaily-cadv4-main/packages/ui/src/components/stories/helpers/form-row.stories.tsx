import type { Meta, StoryObj } from "@storybook/react";
import { FormRow } from "../../form-row";
import { TextField } from "../../fields/text-field";

const meta = {
  title: "Helpers/FormRow",
  component: FormRow,
  tags: ["autodocs"],
} satisfies Meta<typeof FormRow>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: [
      <TextField label="Name" key="name" />,
      <TextField className="w-full" label="Surname" key="surname" />,
    ],
  },
};

export const UseFlex: Story = {
  name: "Use Flex (Allows for children to be variable length)",
  args: {
    useFlex: true,
    children: [
      <TextField className="w-64" label="Name" key="name" />,
      <TextField className="w-full" label="Surname" key="surname" />,
    ],
  },
};
