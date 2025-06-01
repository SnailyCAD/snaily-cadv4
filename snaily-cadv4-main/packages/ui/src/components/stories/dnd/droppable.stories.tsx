import type { Meta, StoryObj } from "@storybook/react";
import { DndProvider, Draggable, Droppable } from "../../dnd";

const meta = {
  title: "Drag and Drop/Droppable",
  component: Droppable,
  tags: ["autodocs"],
} satisfies Meta<typeof Droppable>;

export default meta;
type Story = StoryObj<typeof Droppable>;

function DefaultRenderer() {
  return (
    <DndProvider>
      <div className="flex gap-5 items-center">
        <Droppable onDrop={console.log} accepts={["test"]}>
          <div className="w-64 h-64 bg-gray-200 dark:bg-secondary" />
        </Droppable>

        <Draggable
          type="test"
          item={{
            hello: "world",
          }}
        >
          {() => <div className="max-w-fit max-h-fit">Drag Me</div>}
        </Draggable>
      </div>
    </DndProvider>
  );
}

export const Default: Story = {
  render: () => <DefaultRenderer />,
};
