import {
  type SlateEditor,
  type SlateElements,
  type Text,
  slateDataToString,
} from "@snailycad/utils/editor";
import * as React from "react";
import {
  Editor as _Editor,
  Node as SlateNode,
  type Descendant,
  createEditor,
  Element as SlateElement,
} from "slate";
import {
  Editable,
  ReactEditor,
  type RenderElementProps,
  type RenderLeafProps,
  Slate,
  withReact,
} from "slate-react";
import { withHistory } from "slate-history";
import { Toolbar } from "./toolbar";
import { toggleMark } from "lib/editor/utils";
import isHotkey from "is-hotkey";
import { SHORTCUTS, withShortcuts } from "lib/editor/withShortcuts";
import { withChecklists } from "lib/editor/withChecklists";
import { classNames } from "lib/classNames";
import { useTranslations } from "use-intl";
import { EditorElement } from "./elements/element";
import { EditorLeaf } from "./elements/leaf";

declare module "slate" {
  interface CustomTypes {
    Editor: SlateEditor;
    Element: SlateElements;
    Text: Text;
  }
}

interface EditorProps {
  hideBorder?: boolean;
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
    // @ts-expect-error - Missing types in Slate
    () => withChecklists(withShortcuts(withHistory(withReact(createEditor())))),
    [],
  );
  const isEmpty = React.useMemo(() => {
    return slateDataToString(props.value)?.trim() === "";
  }, [props.value]);

  function handleChange(value: Descendant[]) {
    props.onChange?.(value);
  }

  const handleDOMBeforeInput = React.useCallback(() => {
    queueMicrotask(() => {
      const pendingDiffs = ReactEditor.androidPendingDiffs(editor);

      const scheduleFlush = pendingDiffs?.some(({ diff, path }) => {
        if (!diff.text.endsWith(" ")) {
          return false;
        }

        const { text } = SlateNode.leaf(editor, path);
        const beforeText = text.slice(0, diff.start) + diff.text.slice(0, -1);
        if (!(beforeText in SHORTCUTS)) {
          return;
        }

        const blockEntry = _Editor.above(editor, {
          at: path,
          match: (n) => SlateElement.isElement(n) && _Editor.isBlock(editor, n),
        });
        if (!blockEntry) {
          return false;
        }

        const [, blockPath] = blockEntry;
        return _Editor.isStart(editor, _Editor.start(editor, path), blockPath);
      });

      if (scheduleFlush) {
        ReactEditor.androidScheduleFlush(editor);
      }
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // handle state changes
  React.useEffect(() => {
    editor.children = props.value;
    editor.onChange();
  }, [props.value]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div
      className={classNames(
        "mt-1 rounded-md border w-full shadow-sm",
        props.hideBorder ? "border-none" : "border",
        !props.isReadonly ? "bg-secondary text-white overflow-hidden" : !props.hideBorder && "px-3",
        props.errorMessage ? "border-red-500 focus:border-red-700" : "border-gray-700",
      )}
    >
      <Slate
        // @ts-expect-error - Missing types in Slate
        editor={editor}
        initialValue={props.value as Descendant[]}
        onValueChange={(value) => {
          handleChange(value);
        }}
      >
        {props.isReadonly ? null : <Toolbar />}
        <Editable
          onDOMBeforeInput={handleDOMBeforeInput}
          spellCheck="false"
          autoComplete="off"
          readOnly={props.isReadonly}
          renderLeaf={renderLeaf}
          renderElement={renderElement}
          className={classNames(
            "w-full bg-transparent disabled:cursor-not-allowed disabled:opacity-80 outline-none",
            props.value.length <= 3 ? "pb-10" : "py-1.5",
            props.truncate && "!flex",
            props.isReadonly ? "px-0" : "px-2",
          )}
          placeholder={isEmpty ? common("none") : common("startTyping")}
          onKeyDown={(event) => {
            for (const hotkey in HOTKEYS) {
              if (isHotkey(hotkey)(event)) {
                event.preventDefault();
                const mark = HOTKEYS[hotkey as keyof typeof HOTKEYS];
                toggleMark(editor, mark, true);
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
