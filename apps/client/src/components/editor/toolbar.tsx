import * as RToolbar from "@radix-ui/react-toolbar";
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
import type { SlateElements, Text } from "./types";
import { SelectColorPopover } from "./toolbar/select-color-popover";

/**
 * mostly example code from: https://github.com/ianstormtaylor/slate/blob/main/site/examples/richtext.tsx
 */

export function Toolbar() {
  return (
    <RToolbar.Root className="flex gap-1 mb-2 overflow-x-auto border-b border-secondary bg-tertiary p-2">
      <RToolbar.ToolbarToggleGroup
        className="flex gap-1"
        type="multiple"
        aria-label="Text formatting"
      >
        <MarkButton format="bold" icon={<TypeBold aria-label="bold" />} />
        <MarkButton format="italic" icon={<TypeItalic aria-label="italic" />} />
        <MarkButton format="underline" icon={<TypeUnderline aria-label="underline" />} />
        <MarkButton
          format="strikethrough"
          icon={<TypeStrikethrough aria-label="strikethrough" />}
        />
        <SelectColorPopover format="background-color" icon={<PaintBucket />} />
        <SelectColorPopover format="text-color" icon={<Fonts />} />
      </RToolbar.ToolbarToggleGroup>
      <RToolbar.Separator className="w-[1px] bg-neutral-400 dark:bg-secondary mx-1" />
      <RToolbar.ToolbarToggleGroup
        aria-label="Block formatting"
        className="flex gap-1"
        type="single"
      >
        <BlockButton format="heading-one" icon={<TypeH1 aria-label="heading-one" />} />
        <BlockButton format="heading-two" icon={<TypeH2 aria-label="heading-two" />} />
        <BlockButton format="block-quote" icon={<Quote aria-label="block-quote" />} />
        <BlockButton format="bulleted-list" icon={<ListUl aria-label="bulleted-list" />} />
        <BlockButton format="check-list-item" icon={<ListCheck aria-label="check-list-item" />} />
      </RToolbar.ToolbarToggleGroup>
    </RToolbar.Root>
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
    <RToolbar.ToolbarToggleItem asChild value={format}>
      <Button
        title={format}
        type="button"
        variant={isActive ? null : "default"}
        className={classNames(isActive && "text-white bg-neutral-700")}
        onPress={() => toggleBlock(editor, format)}
      >
        {icon}
      </Button>
    </RToolbar.ToolbarToggleItem>
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
    <RToolbar.ToolbarToggleItem asChild value={format}>
      <Button
        title={format}
        type="button"
        variant={isActive ? null : "default"}
        className={classNames(isActive && "text-white bg-neutral-700")}
        onPress={() => toggleMark(editor, format, value)}
      >
        {icon}
      </Button>
    </RToolbar.ToolbarToggleItem>
  );
}
