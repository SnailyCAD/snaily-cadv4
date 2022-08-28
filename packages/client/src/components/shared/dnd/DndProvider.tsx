import type * as React from "react";
import { DndProvider as ReactDndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";

export function DndProvider({ children }: { children: React.ReactNode }) {
  return <ReactDndProvider backend={HTML5Backend}>{children}</ReactDndProvider>;
}
