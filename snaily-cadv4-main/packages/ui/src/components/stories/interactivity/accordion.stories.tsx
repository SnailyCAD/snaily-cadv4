import type { Meta, StoryObj } from "@storybook/react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../../accordion/accordion";

const meta = {
  title: "Interactivity/Accordion",
  component: Accordion,
  tags: ["autodocs"],
} satisfies Meta<typeof Accordion>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Single: Story = {
  args: {
    type: "single",
    children: [
      <AccordionItem value="item-1" key={0}>
        <AccordionTrigger>Item 1</AccordionTrigger>
        <AccordionContent>Hello world from item 1</AccordionContent>
      </AccordionItem>,
      <AccordionItem value="item-2" key={1}>
        <AccordionTrigger>Item 2</AccordionTrigger>
        <AccordionContent>Hello world from item 2</AccordionContent>
      </AccordionItem>,
      <AccordionItem value="item-3" key={2}>
        <AccordionTrigger>Item 3</AccordionTrigger>
        <AccordionContent>Hello world from item 3</AccordionContent>
      </AccordionItem>,
    ],
  },
};

export const Multiple: Story = {
  args: {
    type: "multiple",
    children: [
      <AccordionItem value="item-1" key={0}>
        <AccordionTrigger>Item 1</AccordionTrigger>
        <AccordionContent>Hello world from item 1</AccordionContent>
      </AccordionItem>,
      <AccordionItem value="item-2" key={1}>
        <AccordionTrigger>Item 2</AccordionTrigger>
        <AccordionContent>Hello world from item 2</AccordionContent>
      </AccordionItem>,
      <AccordionItem value="item-3" key={2}>
        <AccordionTrigger>Item 3</AccordionTrigger>
        <AccordionContent>Hello world from item 3</AccordionContent>
      </AccordionItem>,
    ],
  },
};
