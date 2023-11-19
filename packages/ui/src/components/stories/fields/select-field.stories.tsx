import * as React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { SelectField, type SelectFieldProps } from "../../fields/select-field";
import { within, userEvent } from "@storybook/testing-library";
import { expect } from "@storybook/jest";
import type { Key } from "@react-types/shared";

const meta = {
  title: "Inputs/SelectField",
  component: SelectField,
  tags: ["autodocs"],
  render: (args) => <Renderer {...args} />,
} satisfies Meta<typeof SelectField>;

export default meta;
type Story = StoryObj<typeof meta>;

const OPTIONS = [
  {
    label: "Option 1",
    value: "option-1",
  },
  {
    label: "Option 2",
    value: "option-2",
  },
  {
    label: "Option 3",
    value: "option-3",
  },
];

const OPTIONS_WITH_DESC = OPTIONS.map((option) => ({
  ...option,
  description: "This is a description",
}));

const LARGE_LIST = Array.from({ length: 30 })
  .fill({})
  .map((_, i) => ({
    label: `Option ${i}`,
    value: `option-${i}`,
  }));

function Renderer(args: SelectFieldProps<any>) {
  const [selectedKey, setSelectedKey] = React.useState<Key | null>(null);
  const [selectedKeys, setSelectedKeys] = React.useState<Key[]>([]);

  return (
    <SelectField
      {...args}
      {...(args.selectionMode === "multiple" ? { selectedKeys } : { selectedKey })}
      data-testid="test-select"
      onSelectionChange={(key) => {
        if (args.selectionMode === "multiple") {
          setSelectedKeys(key as string[]);
        } else {
          setSelectedKey(key as string | null);
        }
      }}
    />
  );
}

export const Default: Story = {
  args: { label: "Select an option", options: OPTIONS },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const portal = within(document.body);
    const selectInput = canvas.getByTestId("test-select");

    expect(selectInput).toHaveTextContent("Select...");

    await userEvent.click(selectInput);

    OPTIONS.map(async (option) => {
      expect(await portal.findByText(option.label)).toBeInTheDocument();
    });

    const firstOption = OPTIONS.at(0)!;
    await userEvent.click(portal.getByText(firstOption.label));

    expect(selectInput).toHaveTextContent(firstOption.label);
  },
};

export const Disabled: Story = {
  render: (args) => <Renderer {...args} />,
  args: {
    label: "Select an option",
    options: OPTIONS,
    isDisabled: true,
  },
};

export const MultiSelect: Story = {
  args: {
    label: "Select multiple options",
    options: OPTIONS,
    selectedKeys: ["option-3", "option-1"],
    selectionMode: "multiple",
  },
};

export const MultiSelectLargeList: Story = {
  args: {
    label: "Select multiple options",
    options: LARGE_LIST,
    selectedKeys: LARGE_LIST.slice(5, 30).map((o) => o.value),
    selectionMode: "multiple",
  },
};

export const MultiWithDescription: Story = {
  args: {
    label: "Select multiple options",
    options: OPTIONS_WITH_DESC,
    selectedKeys: OPTIONS_WITH_DESC.map((v) => v.value),
    selectionMode: "multiple",
  },
};
