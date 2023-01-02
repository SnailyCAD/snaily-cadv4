import * as React from "react";
import * as Popover from "@radix-ui/react-popover";
import { ToolbarToggleItem } from "@radix-ui/react-toolbar";
import { Button } from "@snailycad/ui";
import { classNames } from "lib/classNames";
import { isMarkActive, toggleMark } from "lib/editor/utils";
import type { Text } from "slate";
import { useSlate } from "slate-react";
import { HexColorPicker } from "react-colorful";
import { useTranslations } from "use-intl";

interface SelectColorPopoverProps {
  format: keyof Pick<Text, "color" | "backgroundColor">;
  icon: any;
}

export function SelectColorPopover({ icon, format }: SelectColorPopoverProps) {
  const editor = useSlate();
  const isActive = isMarkActive(editor, format);
  const common = useTranslations("Common");

  const [isPopover, setIsPopoverOpen] = React.useState(false);
  const [color, setColor] = React.useState("");

  function handleSave(value: boolean) {
    toggleMark(editor, format, color);
    setIsPopoverOpen(value);
  }

  return (
    <Popover.Root onOpenChange={handleSave} open={isPopover}>
      <Popover.Trigger>
        <ToolbarToggleItem asChild value={format}>
          <Button
            title={format}
            type="button"
            variant={isActive ? null : "default"}
            className={classNames(isActive && "text-white bg-neutral-700")}
            onPress={() => setIsPopoverOpen((v) => !v)}
          >
            {icon}
          </Button>
        </ToolbarToggleItem>
      </Popover.Trigger>

      <Popover.Content
        className={classNames(
          "z-50 p-4 bg-gray-200 rounded-md shadow-md dark:shadow-primary dropdown-fade w-70 dark:bg-primary dark:border dark:border-secondary",
        )}
      >
        <header className="flex items-center justify-between mb-5">
          <h3 className="text-xl font-semibold">{common(format)}</h3>
          <Button className="" onPress={() => handleSave(false)}>
            {common("ok")}
          </Button>
        </header>

        <HexColorPicker onChange={setColor} color={color} />

        <Popover.Arrow className="fill-primary" />
      </Popover.Content>
    </Popover.Root>
  );
}
