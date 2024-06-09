import { classNames } from "lib/classNames";
import { Transforms } from "slate";
import { ReactEditor, useReadOnly, type RenderElementProps, useSlate } from "slate-react";
import type { CheckListItemElement as ICheckListItemElement } from "@snailycad/utils/editor";
import { CheckboxField } from "@snailycad/ui";

type Props = RenderElementProps & { element: ICheckListItemElement };

export function CheckListItemElement({ attributes, children, element }: Props) {
  const editor = useSlate();
  const readOnly = useReadOnly();

  function handleSelectionChange(isSelected: boolean) {
    // @ts-expect-error - Missing types in Slate
    const path = ReactEditor.findPath(editor, element);

    Transforms.setNodes(editor, { checked: isSelected }, { at: path });
  }

  return (
    <div {...attributes} className="flex flex-row items-center !mt-0">
      <CheckboxField
        isReadOnly={readOnly}
        isSelected={element.checked}
        onChange={handleSelectionChange}
      >
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
      </CheckboxField>
    </div>
  );
}
