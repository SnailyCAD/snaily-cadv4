import * as React from "react";
import { useDrag } from "react-dnd";

interface Props {
  children: React.ReactElement;
  type: string;
  item: any;
}

export function Draggable({ type, item, children }: Props) {
  const [{ opacity }, drag] = useDrag(
    () => ({
      type,
      item,
      collect: (monitor) => ({
        opacity: monitor.isDragging() ? 0.4 : 1,
      }),
    }),
    [item, type],
  );

  return (
    <span ref={drag} style={{ opacity }}>
      {children}
    </span>
  );
}
