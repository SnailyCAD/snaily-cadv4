import { classNames } from "lib/classNames";
import { Transforms } from "slate";
import { ReactEditor, useReadOnly, useSlateStatic, type RenderElementProps } from "slate-react";
import type { CheckListItemElement as ICheckListItemElement } from "../types";

type Props = RenderElementProps & { element: ICheckListItemElement };

export function CheckListItemElement({ attributes, children, element }: Props) {
  const editor = useSlateStatic();
  const readOnly = useReadOnly();

  return (
    <div {...attributes} className="flex flex-row items-center !mt-0">
      <span contentEditable={false} className="mr-3">
        <input
          disabled={readOnly}
          type="checkbox"
          checked={element.checked}
          onChange={(event) => {
            if (readOnly) return;
            const path = ReactEditor.findPath(editor, element);

            Transforms.setNodes(editor, { checked: event.target.checked }, { at: path });
          }}
        />
      </span>
      <span
        contentEditable={!readOnly}
        suppressContentEditableWarning
        className={classNames(
          "flex-1 outline-none",
          element.checked ? "line-through" : "none",
          element.checked ? "opacity-60" : "opacity-100",
        )}
      >
        {children}
      </span>
    </div>
  );
}
