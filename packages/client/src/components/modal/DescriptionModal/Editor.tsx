import { classNames } from "lib/classNames";
import * as React from "react";
import { BaseEditor, Descendant, createEditor } from "slate";
import { Editable, ReactEditor, Slate, withReact } from "slate-react";
import { Toolbar } from "./Toolbar";

type CustomElement = { type: "paragraph"; children: CustomText[] };
type CustomText = { text: string };

declare module "slate" {
  interface CustomTypes {
    Editor: BaseEditor & ReactEditor;
    Element: CustomElement;
    Text: CustomText;
  }
}

interface EditorProps {
  value: Descendant[];
  onChange: React.Dispatch<React.SetStateAction<Descendant[]>>;
}

export const DEFAULT_EDITOR_DATA = [
  {
    type: "paragraph",
    children: [{ text: "" }],
  },
];

export function Editor({ value, onChange }: EditorProps) {
  const renderElement = React.useCallback((props) => <Element {...props} />, []);
  const renderLeaf = React.useCallback((props) => <Leaf {...props} />, []);
  const [editor] = React.useState(() => withReact(createEditor()));

  return (
    <div className="mt-1">
      <Slate editor={editor} value={value} onChange={onChange}>
        <Toolbar />
        <Editable
          renderLeaf={renderLeaf}
          renderElement={renderElement}
          style={{ minHeight: "5em" }}
          className={classNames(
            `
      w-full p-1.5 rounded-md bg-transparent
      disabled:cursor-not-allowed disabled:opacity-80`,
          )}
          placeholder="Start typing..."
        />
      </Slate>
    </div>
  );
}

function Leaf({ attributes, children, leaf }: any) {
  if (leaf.bold) {
    children = <strong>{children}</strong>;
  }

  if (leaf.code) {
    children = <code>{children}</code>;
  }

  if (leaf.italic) {
    children = <em>{children}</em>;
  }

  if (leaf.underline) {
    children = <u>{children}</u>;
  }

  if (leaf.strikethrough) {
    children = <s>{children}</s>;
  }

  return <span {...attributes}>{children}</span>;
}

function Element({ attributes, children, element }: any) {
  switch (element.type) {
    case "block-quote":
      return (
        <blockquote {...attributes} className="border-l-[3px] dark:border-[#3f3f3f] pl-2">
          {children}
        </blockquote>
      );
    case "bulleted-list":
      return <ul {...attributes}>{children}</ul>;
    case "heading-one":
      return (
        <h1 {...attributes} className="text-2xl font-semibold">
          {children}
        </h1>
      );
    case "heading-two":
      return (
        <h2 {...attributes} className="text-xl font-semibold">
          {children}
        </h2>
      );
    case "list-item":
      return <li {...attributes}>{children}</li>;
    case "numbered-list":
      return <ol {...attributes}>{children}</ol>;
    default:
      return <p {...attributes}>{children}</p>;
  }
}
