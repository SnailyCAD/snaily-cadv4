import type { RenderLeafProps } from "slate-react";

export function EditorLeaf({ attributes, children, leaf }: RenderLeafProps) {
  if (leaf.bold) {
    children = <strong {...attributes}>{children}</strong>;
  }

  if (leaf.italic) {
    children = <em {...attributes}>{children}</em>;
  }

  if (leaf.underline) {
    children = <u {...attributes}>{children}</u>;
  }

  if (leaf.strikethrough) {
    children = <s {...attributes}>{children}</s>;
  }

  return <span {...attributes}>{children}</span>;
}
