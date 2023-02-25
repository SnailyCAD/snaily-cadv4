import * as React from "react";
import { useDrag } from "react-dnd";

interface Props {
  canDrag?: boolean;
  type: string;
  item: unknown;
  children({ isDragging }: { isDragging: boolean }): React.ReactElement;
  onDrag?(isDragging: boolean): void;
}

export function Draggable(props: Props) {
  const [{ opacity, isDragging }, drag] = useDrag(
    () => ({
      type: props.type,
      item: props.item,
      collect: (monitor) => ({
        canDrag: props.canDrag,
        opacity: monitor.isDragging() ? 0.4 : 1,
        isDragging: monitor.isDragging(),
      }),
    }),
    [props.item, props.canDrag, props.type],
  );

  React.useEffect(() => {
    props.onDrag?.(isDragging);
  }, [isDragging]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div ref={drag} style={{ opacity }}>
      {props.children({ isDragging })}
    </div>
  );
}
