import * as React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { JsonEditor } from "../../editors/json-editor";

const meta = {
  title: "Editors/JSON Editor",
  component: JsonEditor,
  tags: ["autodocs"],
} satisfies Meta<typeof JsonEditor>;

export default meta;
type Story = StoryObj<typeof JsonEditor>;

function DefaultRenderer() {
  const [value, setValue] = React.useState<string | undefined>("");

  return <JsonEditor value={value ?? ""} onChange={setValue} />;
}

export const Default: Story = {
  render: () => <DefaultRenderer />,
};
