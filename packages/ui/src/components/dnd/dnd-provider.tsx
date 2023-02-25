import type * as React from "react";
import { DndProvider as ReactDndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";

interface Props {
  children: React.ReactNode;
}

export function DndProvider(props: Props) {
  return <ReactDndProvider backend={HTML5Backend}>{props.children}</ReactDndProvider>;
}
