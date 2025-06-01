import {
  Fonts,
  ListCheck,
  ListUl,
  PaintBucket,
  Quote,
  TypeBold,
  TypeH1,
  TypeH2,
  TypeItalic,
  TypeStrikethrough,
  TypeUnderline,
} from "react-bootstrap-icons";
import { useSlate } from "slate-react";
import { Button } from "@snailycad/ui";
import { classNames } from "lib/classNames";
import { isBlockActive, toggleMark, toggleBlock, isMarkActive } from "lib/editor/utils";
import { SelectColorPopover } from "./toolbar/select-color-popover";
import type { SlateElements, Text } from "@snailycad/utils/editor";

/**
 * mostly example code from: https://github.com/ianstormtaylor/slate/blob/main/site/examples/richtext.tsx
 */

export function Toolbar() {
  return (
    <div className="flex gap-1 mb-2 overflow-x-auto border-b border-secondary bg-tertiary p-2">
      <div className="flex gap-1" aria-label="Text formatting">
        <MarkButton format="bold" icon={<TypeBold aria-label="bold" />} />
        <MarkButton format="italic" icon={<TypeItalic aria-label="italic" />} />
        <MarkButton format="underline" icon={<TypeUnderline aria-label="underline" />} />
        <MarkButton
          format="strikethrough"
          icon={<TypeStrikethrough aria-label="strikethrough" />}
        />
        <SelectColorPopover format="background-color" icon={<PaintBucket />} />
        <SelectColorPopover format="text-color" icon={<Fonts />} />
      </div>
      <span className="w-[1px] bg-neutral-400 dark:bg-secondary mx-1" />
      <div aria-label="Block formatting" className="flex gap-1">
        <BlockButton format="heading-one" icon={<TypeH1 aria-label="heading-one" />} />
        <BlockButton format="heading-two" icon={<TypeH2 aria-label="heading-two" />} />
        <BlockButton format="block-quote" icon={<Quote aria-label="block-quote" />} />
        <BlockButton format="bulleted-list" icon={<ListUl aria-label="bulleted-list" />} />
        <BlockButton format="check-list-item" icon={<ListCheck aria-label="check-list-item" />} />
      </div>
    </div>
  );
}

interface BlockButtonProps {
  format: SlateElements["type"];
  icon: React.ReactNode;
}

function BlockButton({ format, icon }: BlockButtonProps) {
  const editor = useSlate();
  const isActive = isBlockActive(editor, format);

  return (
    <Button
      title={format}
      type="button"
      variant={isActive ? null : "default"}
      className={classNames(isActive && "text-white bg-neutral-700")}
      onPress={() => toggleBlock(editor, format)}
    >
      {icon}
    </Button>
  );
}

interface MarkButtonProps {
  format: keyof Omit<Text, "text">;
  icon: React.ReactNode;
  value?: unknown;
}

function MarkButton({ format, icon, value = true }: MarkButtonProps) {
  const editor = useSlate();
  const isActive = isMarkActive(editor, format);

  return (
    <Button
      title={format}
      type="button"
      variant={isActive ? null : "default"}
      className={classNames(isActive && "text-white bg-neutral-700")}
      onPress={() => toggleMark(editor, format, value)}
    >
      {icon}
    </Button>
  );
}
