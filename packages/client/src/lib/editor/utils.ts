import { Editor, type BaseEditor, Transforms, Element as SlateElement } from "slate";
import type { ReactEditor } from "slate-react";

const LIST_TYPES = ["numbered-list", "bulleted-list"];

export function isMarkActive(editor: BaseEditor & ReactEditor, format: string) {
  const marks = Editor.marks(editor);

  return marks ? (marks as any)[format] === true : false;
}

export function toggleBlock(editor: BaseEditor & ReactEditor, format: string) {
  const isActive = isBlockActive(editor, format);
  const isList = LIST_TYPES.includes(format);

  Transforms.unwrapNodes(editor, {
    match: (n) => !Editor.isEditor(n) && SlateElement.isElement(n) && LIST_TYPES.includes(n.type),
    split: true,
  });

  const newProperties: Partial<SlateElement> = {
    // @ts-expect-error ignore
    type: isActive ? "paragraph" : isList ? "list-item" : format,
  };
  Transforms.setNodes<SlateElement>(editor, newProperties);

  if (!isActive && isList) {
    const block = { type: format, children: [] };
    // @ts-expect-error ignore
    Transforms.wrapNodes(editor, block);
  }
}

export function toggleMark(editor: BaseEditor & ReactEditor, format: string) {
  const isActive = isMarkActive(editor, format);

  if (isActive) {
    Editor.removeMark(editor, format);
  } else {
    Editor.addMark(editor, format, true);
  }
}

export function isBlockActive(editor: BaseEditor & ReactEditor, format: string) {
  const { selection } = editor;
  if (!selection) return false;

  const [match] = Array.from(
    Editor.nodes(editor, {
      at: Editor.unhangRange(editor, selection),
      match: (n) => {
        if (Editor.isEditor(n)) return false;

        if ("text" in n) {
          return (n as any)[format];
        }

        return n.type === format;
      },
    }),
  );

  return !!match;
}
