import { Editor, Transforms, Range, Point, Element as SlateElement } from "slate";
import type { SlateEditor } from "components/editor/editor";

type SHORTCUTS = (typeof SHORTCUTS)[keyof typeof SHORTCUTS];
export const SHORTCUTS = {
  "*": "list-item",
  "-": "list-item",
  "+": "list-item",
  ">": "block-quote",
  "#": "heading-one",
  "##": "heading-two",
  "[]": "check-list-item",
} as const;

export function withShortcuts(editor: SlateEditor) {
  const { deleteBackward, insertText } = editor;

  editor.insertText = (text) => {
    const { selection } = editor;

    if (text.endsWith(" ") && selection && Range.isCollapsed(selection)) {
      const { anchor } = selection;
      const block = Editor.above(editor, {
        match: (n) => Editor.isBlock(editor, n as any),
      });
      const path = block ? block[1] : [];
      const start = Editor.start(editor, path);
      const range = { anchor, focus: start };
      const beforeText = (Editor.string(editor, range) +
        text.slice(0, -1)) as keyof typeof SHORTCUTS;
      const type = SHORTCUTS[beforeText] as SHORTCUTS | undefined;

      if (type) {
        Transforms.select(editor, range);

        if (!Range.isCollapsed(range)) {
          Transforms.delete(editor);
        }

        const newProperties: Partial<SlateElement> = {
          type,
        };
        Transforms.setNodes<SlateElement>(editor, newProperties, {
          match: (n) => Editor.isBlock(editor, n as any),
        });

        if (type === "list-item") {
          const list: SlateElement = { type: "bulleted-list", children: [] };

          Transforms.wrapNodes(editor, list, {
            match: (n) =>
              !Editor.isEditor(n) && SlateElement.isElement(n) && n.type === "list-item",
          });
        }

        return;
      }
    }

    insertText(text);
  };

  editor.deleteBackward = (...args) => {
    const { selection } = editor;

    if (selection && Range.isCollapsed(selection)) {
      const match = Editor.above(editor, {
        match: (n) => Editor.isBlock(editor, n as any),
      });

      if (match) {
        const [block, path] = match;
        const start = Editor.start(editor, path);

        if (
          !Editor.isEditor(block) &&
          SlateElement.isElement(block) &&
          block.type !== "paragraph" &&
          Point.equals(selection.anchor, start)
        ) {
          Transforms.setNodes(editor, { type: "paragraph" });

          if (block.type === "list-item") {
            Transforms.unwrapNodes(editor, {
              match: (n) =>
                !Editor.isEditor(n) && SlateElement.isElement(n) && n.type === "bulleted-list",
              split: true,
            });
          }

          return;
        }
      }

      deleteBackward(...args);
    }
  };

  return editor;
}
