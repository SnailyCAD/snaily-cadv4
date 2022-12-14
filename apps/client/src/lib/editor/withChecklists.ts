import { Editor, Transforms, Range, Point, Element as SlateElement } from "slate";
import type { SlateEditor } from "components/editor/editor";

export function withChecklists(editor: SlateEditor) {
  const { deleteBackward } = editor;

  editor.deleteBackward = (...args) => {
    const { selection } = editor;

    if (selection && Range.isCollapsed(selection)) {
      const [match] = Editor.nodes(editor, {
        match: (n) =>
          !Editor.isEditor(n) && SlateElement.isElement(n) && n.type === "check-list-item",
      });

      if (match) {
        const [, path] = match;

        const start = Editor.start(editor, path);

        if (Point.equals(selection.anchor, start)) {
          Transforms.setNodes(
            editor,
            { type: "paragraph" },
            {
              match: (n) =>
                !Editor.isEditor(n) && SlateElement.isElement(n) && n.type === "check-list-item",
            },
          );
          return;
        }
      }
    }

    deleteBackward(...args);
  };

  return editor;
}
