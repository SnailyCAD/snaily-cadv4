import * as React from "react";
import { useDrag } from "react-dnd";

interface Props {
  children: React.ReactElement;
  canDrag?: boolean;
  type: string;
  item: any;
}

export function Draggable({ canDrag, type, item, children }: Props) {
  const [{ opacity }, drag] = useDrag(
    () => ({
      type,
      item,
      canDrag,
      options: { dropEffect: "copy" },
      collect: (monitor) => ({
        opacity: monitor.isDragging() ? 0.4 : 1,
      }),
    }),
    [item, canDrag, type],
  );

  return (
    <span ref={drag} style={{ opacity }}>
      {children}
    </span>
  );
}
