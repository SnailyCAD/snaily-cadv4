import * as React from "react";
import { useDrag } from "react-dnd";

interface Props {
  children({ isDragging }: { isDragging: boolean }): React.ReactElement;
  canDrag?: boolean;
  type: string;
  item: unknown;
  onDrag?(isDragging: boolean): void;
}

export function Draggable({ canDrag, type, item, onDrag, children }: Props) {
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

  React.useEffect(() => {
    onDrag?.(isDragging);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDragging]);

  return (
    <div ref={drag} style={{ opacity }}>
      {children({ isDragging })}
    </div>
  );
}
