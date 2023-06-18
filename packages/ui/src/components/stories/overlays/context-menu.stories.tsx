import type { Meta, StoryObj } from "@storybook/react";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "../../context-menu";

const meta = {
  title: "Overlays/ContextMenu",
  component: ContextMenu,
  tags: ["autodocs"],
} satisfies Meta<typeof ContextMenu>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: [
      <ContextMenuTrigger asChild key="trigger">
        <span className="dark:text-white bg-gray-100 dark:bg-secondary p-5 block cursor-default rounded-md">
          Right click here
        </span>
      </ContextMenuTrigger>,

      <ContextMenuContent key="content">
        <ContextMenuItem>Item 1</ContextMenuItem>
        <ContextMenuItem>Item 2</ContextMenuItem>
        <ContextMenuItem>Item 3</ContextMenuItem>
        <ContextMenuItem>Item 4</ContextMenuItem>
      </ContextMenuContent>,
    ],
  },
};
