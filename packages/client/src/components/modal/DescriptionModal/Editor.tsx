import { classNames } from "lib/classNames";
import * as React from "react";
import { BaseEditor, Descendant, createEditor } from "slate";
import { Editable, ReactEditor, Slate, withReact } from "slate-react";
import { JsonArray } from "type-fest";
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
  isReadonly?: boolean;
  value: Descendant[] | JsonArray;
  onChange?: (value: Descendant[]) => void;
}

export const DEFAULT_EDITOR_DATA = [
  {
    type: "paragraph",
    children: [{ text: "" }],
  },
] as Descendant[];

export function Editor({ isReadonly, value, onChange }: EditorProps) {
  const renderElement = React.useCallback((props) => <Element {...props} />, []);
  const renderLeaf = React.useCallback((props) => <Leaf {...props} />, []);
  const [editor] = React.useState(() => withReact(createEditor()));

  function handleChange(value: Descendant[]) {
    onChange?.(value);
  }

  return (
    <div className="mt-1">
      <Slate editor={editor} value={value as Descendant[]} onChange={handleChange}>
        {isReadonly ? null : <Toolbar />}
        <Editable
          readOnly={isReadonly}
          renderLeaf={renderLeaf}
          renderElement={renderElement}
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

export function dataToSlate(
  data: { description?: string | null; descriptionData?: JsonArray } | null | undefined,
) {
  if (Array.isArray(data?.descriptionData)) {
    return data?.descriptionData as Descendant[];
  }

  if (typeof data?.description === "string") {
    return [{ type: "paragraph", children: [{ text: data.description }] }] as Descendant[];
  }

  return DEFAULT_EDITOR_DATA;
}
