import type { Meta, StoryObj } from "@storybook/react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLinkItem,
  DropdownMenuTrigger,
} from "../../dropdown";
import { Button } from "../../button/button";

const meta = {
  title: "Overlays/DropdownMenu",
  component: DropdownMenu,
  tags: ["autodocs"],
} satisfies Meta<typeof DropdownMenu>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: [
      <DropdownMenuTrigger asChild key="trigger">
        <Button>Dropdown</Button>
      </DropdownMenuTrigger>,

      <DropdownMenuContent align="start" key="content">
        <DropdownMenuItem>Item 1</DropdownMenuItem>
        <DropdownMenuItem>Item 2</DropdownMenuItem>
        <DropdownMenuItem>Item 3</DropdownMenuItem>
        <DropdownMenuItem>Item 4</DropdownMenuItem>
      </DropdownMenuContent>,
    ],
  },
};

export const WithLinks: Story = {
  args: {
    children: [
      <DropdownMenuTrigger asChild key="trigger">
        <Button>Dropdown</Button>
      </DropdownMenuTrigger>,

      <DropdownMenuContent align="start" key="content">
        <DropdownMenuItem>Item 1</DropdownMenuItem>
        <DropdownMenuItem>Item 2</DropdownMenuItem>
        <DropdownMenuLinkItem href="/home">Go to /home</DropdownMenuLinkItem>
        <DropdownMenuItem>Item 4</DropdownMenuItem>
      </DropdownMenuContent>,
    ],
  },
};
