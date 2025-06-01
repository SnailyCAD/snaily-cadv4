import type { Meta, StoryObj } from "@storybook/react";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "../../hover-card";
import { Button } from "../../button/button";

const meta = {
  title: "Overlays/HoverCard",
  component: HoverCard,
  tags: ["autodocs"],
} satisfies Meta<typeof HoverCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: [
      <HoverCardTrigger className="w-fit underline dark:text-white" key="test">
        Hover Me!
      </HoverCardTrigger>,

      <HoverCardContent key="content">This is a super cool hover card.</HoverCardContent>,
    ],
  },
};

export const WithInteraction: Story = {
  args: {
    children: [
      <HoverCardTrigger className="w-fit underline dark:text-white" key="test">
        Hover Me!
      </HoverCardTrigger>,

      <HoverCardContent pointerEvents key="content">
        This is a super cool hover card. You can also interact inside of it.
        <Button className="mt-3" onPress={() => alert("Hello world! ")}>
          Click Me!
        </Button>
      </HoverCardContent>,
    ],
  },
};
