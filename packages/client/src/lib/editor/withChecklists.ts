/* eslint-disable @typescript-eslint/no-unnecessary-condition */
import type { ReactEditor } from "slate-react";
import { Editor, Transforms, Range, Point, Element as SlateElement, type BaseEditor } from "slate";

export function withChecklists(editor: BaseEditor & ReactEditor) {
  const { deleteBackward } = editor;

  editor.deleteBackward = (...args) => {
    const { selection } = editor;

    if (selection && Range.isCollapsed(selection)) {
      const [match] = Editor.nodes(editor, {
        match: (n) =>
          // @ts-expect-error ignore
          !Editor.isEditor(n) && SlateElement.isElement(n) && n.type === "check-list-item",
      });

      if (match) {
        const [, path] = match;
        const start = Editor.start(editor, path);

        if (Point.equals(selection.anchor, start)) {
          const newProperties: Partial<SlateElement> = {
            type: "paragraph",
          };
          Transforms.setNodes(editor, newProperties, {
            match: (n) =>
              // @ts-expect-error ignore
              !Editor.isEditor(n) && SlateElement.isElement(n) && n.type === "check-list-item",
          });
          return;
        }
      }
    }

    deleteBackward(...args);
  };

  return editor;
}
