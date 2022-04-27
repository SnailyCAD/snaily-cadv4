import * as React from "react";
import { useDrag } from "react-dnd";

interface Props {
  children({ isDragging }: { isDragging: boolean }): React.ReactElement;
  canDrag?: boolean;
  type: string;
  item: any;
}

export function Draggable({ canDrag, type, item, children }: Props) {
  const [{ opacity, isDragging }, drag] = useDrag(
    () => ({
      type,
      item,
      canDrag,
      collect: (monitor) => ({
        opacity: monitor.isDragging() ? 0.4 : 1,
        isDragging: monitor.isDragging(),
      }),
    }),
    [item, canDrag, type],
  );

  return (
    <div ref={drag} style={{ opacity }}>
      {children({ isDragging })}
    </div>
  );
}
