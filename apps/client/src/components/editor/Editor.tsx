import * as React from "react";
import { BaseEditor, Descendant, createEditor } from "slate";
import {
  Editable,
  ReactEditor,
  RenderElementProps,
  RenderLeafProps,
  Slate,
  withReact,
} from "slate-react";
import { type HistoryEditor, withHistory } from "slate-history";
import { Toolbar } from "./Toolbar";
import { toggleMark } from "lib/editor/utils";
import isHotkey from "is-hotkey";
import { withShortcuts } from "lib/editor/withShortcuts";
import { withChecklists } from "lib/editor/withChecklists";
import { CheckListItemElement } from "./ChecklistItem";
import type { SlateElements, Text } from "./types";
import { classNames } from "lib/classNames";

export type SlateEditor = BaseEditor & ReactEditor & HistoryEditor;

declare module "slate" {
  interface CustomTypes {
    Editor: SlateEditor;
    Element: SlateElements;
    Text: Text;
  }
}

interface EditorProps {
  isReadonly?: boolean;
  value: any;
  onChange?(value: Descendant[]): void;
  truncate?: boolean;
  errorMessage?: string;
}

export const DEFAULT_EDITOR_DATA = [
  {
    type: "paragraph",
    children: [{ text: "" }],
  },
] as Descendant[];

const HOTKEYS = {
  "mod+b": "bold",
  "mod+i": "italic",
  "mod+u": "underline",
  "mod+s": "strikethrough",
} as const;

export function Editor(props: EditorProps) {
  const renderElement = React.useCallback(
    (props: RenderElementProps) => <Element {...props} />,
    [],
  );
  const renderLeaf = React.useCallback((props: RenderLeafProps) => <Leaf {...props} />, []);
  const editor = React.useMemo(
    () => withChecklists(withShortcuts(withHistory(withReact(createEditor())))),
    [],
  );

  function handleChange(value: Descendant[]) {
    props.onChange?.(value);
  }

  // handle state changes
  React.useEffect(() => {
    editor.children = props.value;
    editor.onChange();
  }, [props.value]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div
      className={classNames(
        "mt-1 rounded-md border w-full shadow-sm",
        !props.isReadonly ? "bg-secondary text-white overflow-hidden" : "px-1.5 py-2",
        props.errorMessage ? "border-red-500 focus:border-red-700" : "border-gray-700",
      )}
    >
      <Slate
        editor={editor}
        value={props.value as Descendant[]}
        onChange={(value) => {
          const isAstChange = editor.operations.some(
            (operation) => operation.type !== "set_selection",
          );

          if (isAstChange) {
            handleChange(value);
          }
        }}
      >
        {props.isReadonly ? null : <Toolbar />}
        <Editable
          spellCheck="false"
          autoComplete="off"
          readOnly={props.isReadonly}
          renderLeaf={renderLeaf}
          renderElement={renderElement}
          className={classNames(
            "w-full bg-transparent disabled:cursor-not-allowed disabled:opacity-80 py-1.5",
            props.truncate && "!flex",
            props.isReadonly ? "px-0" : "px-2",
          )}
          placeholder="Start typing..."
          onKeyDown={(event) => {
            for (const hotkey in HOTKEYS) {
              if (isHotkey(hotkey)(event)) {
                event.preventDefault();
                const mark = HOTKEYS[hotkey as keyof typeof HOTKEYS];
                toggleMark(editor, mark);
              }
            }
          }}
        />
      </Slate>
    </div>
  );
}

function Leaf({ attributes, children, leaf }: RenderLeafProps) {
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

function Element({ attributes, children, element, ...rest }: RenderElementProps) {
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
      return (
        <li {...attributes} data-list-item="true">
          {children}
        </li>
      );
    case "check-list-item":
      return <CheckListItemElement {...{ children, attributes, element, ...rest }} />;
    default:
      return <p {...attributes}>{children}</p>;
  }
}

export function dataToSlate(
  data:
    | {
        description?: string | null;
        body?: string | null;
        descriptionData?: any;
        bodyData?: any;
      }
    | null
    | undefined,
) {
  if (!data) {
    return DEFAULT_EDITOR_DATA;
  }

  const descriptionData = data.descriptionData ?? data.bodyData;
  const description = data.description ?? data.body;

  if (Array.isArray(descriptionData) && !description) {
    return descriptionData as unknown as Descendant[];
  }

  if (typeof description === "string") {
    return [{ type: "paragraph", children: [{ text: description }] }] as Descendant[];
  }

  return DEFAULT_EDITOR_DATA;
}
