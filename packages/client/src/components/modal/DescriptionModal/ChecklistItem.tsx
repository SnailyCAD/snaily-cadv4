import { classNames } from "lib/classNames";
import { Transforms } from "slate";
import { ReactEditor, useReadOnly, useSlateStatic } from "slate-react";

export function CheckListItemElement({ attributes, children, element }: any) {
  const editor = useSlateStatic();
  const readOnly = useReadOnly();

  const { checked } = element;
  return (
    <div {...attributes} className="flex flex-row items-center !mt-0">
      <span contentEditable={false} className="mr-3">
        <input
          type="checkbox"
          checked={checked}
          onChange={(event) => {
            const path = ReactEditor.findPath(editor, element);
            const newProperties = {
              checked: event.target.checked,
            };
            // @ts-expect-error ignore
            Transforms.setNodes(editor, newProperties, { at: path });
          }}
        />
      </span>
      <span
        contentEditable={!readOnly}
        suppressContentEditableWarning
        className={classNames(
          "flex-1 outline-none",
          checked ? "line-through" : "none",
          checked ? "opacity-60" : "opacity-100",
        )}
      >
        {children}
      </span>
    </div>
  );
}
