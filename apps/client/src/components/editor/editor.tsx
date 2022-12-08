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
import { Toolbar } from "./toolbar";
import { toggleMark } from "lib/editor/utils";
import isHotkey from "is-hotkey";
import { withShortcuts } from "lib/editor/withShortcuts";
import { withChecklists } from "lib/editor/withChecklists";
import type { SlateElements, Text } from "./types";
import { classNames } from "lib/classNames";
import { dataToString } from "lib/editor/dataToString";
import { useTranslations } from "use-intl";
import { EditorElement } from "./elements/element";
import { EditorLeaf } from "./elements/leaf";

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
  const common = useTranslations("Common");

  const renderElement = React.useCallback(
    (props: RenderElementProps) => <EditorElement {...props} />,
    [],
  );
  const renderLeaf = React.useCallback((props: RenderLeafProps) => <EditorLeaf {...props} />, []);
  const editor = React.useMemo(
    () => withChecklists(withShortcuts(withHistory(withReact(createEditor())))),
    [],
  );
  const isEmpty = React.useMemo(() => {
    return dataToString(props.value)?.trim() === "";
  }, [props.value]);

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
        !props.isReadonly ? "bg-secondary text-white overflow-hidden" : "px-3",
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
          placeholder={isEmpty ? common("none") : common("startTyping")}
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
