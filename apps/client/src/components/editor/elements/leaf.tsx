import type { RenderLeafProps } from "slate-react";

export function EditorLeaf({ attributes, children, leaf }: RenderLeafProps) {
  const style = {
    color: leaf["text-color"],
    backgroundColor: leaf["background-color"],
  };

  if (leaf.bold) {
    children = (
      <strong {...attributes} style={style}>
        {children}
      </strong>
    );
  }

  if (leaf.italic) {
    children = (
      <em {...attributes} style={style}>
        {children}
      </em>
    );
  }

  if (leaf.underline) {
    children = (
      <u {...attributes} style={style}>
        {children}
      </u>
    );
  }

  if (leaf.strikethrough) {
    children = (
      <s {...attributes} style={style}>
        {children}
      </s>
    );
  }

  return (
    <span {...attributes} style={style}>
      {children}
    </span>
  );
}
