import { classNames } from "lib/classNames";
import * as React from "react";
import { useDrop } from "react-dnd";

interface Props {
  onDrop(item: any): void;
  accepts: string[];
  canDrop?(item: any): boolean;
  children: React.ReactChild;
}

export function _Droppable({ accepts, children, canDrop, onDrop }: Props) {
  const [{ isOver, canDrop: _canDrop }, drop] = useDrop({
    accept: accepts,
    canDrop,
    drop: onDrop,
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
  });

  const isActive = isOver && _canDrop;

  return (
    <div
      className={classNames(isActive && "outline outline-2 outline-offset-[5px] rounded-sm")}
      ref={drop}
    >
      {children}
    </div>
  );
}

export const Droppable = React.memo(_Droppable);
