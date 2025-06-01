import type { RenderLeafProps } from "slate-react";

export function EditorLeaf({ attributes, children, leaf }: RenderLeafProps) {
  const style = {
    color: leaf["text-color"],
    backgroundColor: leaf["background-color"],
  };

  const elementProps = {
    ...attributes,
    style,
  };

  if (leaf.bold) {
    children = <strong {...elementProps}>{children}</strong>;
  }

  if (leaf.italic) {
    children = <em {...elementProps}>{children}</em>;
  }

  if (leaf.underline) {
    children = <u {...elementProps}>{children}</u>;
  }

  if (leaf.strikethrough) {
    children = <s {...elementProps}>{children}</s>;
  }

  return <span {...elementProps}>{children}</span>;
}
