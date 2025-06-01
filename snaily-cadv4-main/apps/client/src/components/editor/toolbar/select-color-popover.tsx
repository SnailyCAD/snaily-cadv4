import * as React from "react";
import * as Popover from "@radix-ui/react-popover";
import { Button, buttonVariants } from "@snailycad/ui";
import { classNames } from "lib/classNames";
import { isMarkActive, toggleMark } from "lib/editor/utils";
import type { Text } from "slate";
import { useSlate } from "slate-react";
import { HexColorPicker } from "react-colorful";
import { useTranslations } from "use-intl";

interface SelectColorPopoverProps {
  format: keyof Pick<Text, "text-color" | "background-color">;
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
      <Popover.Trigger
        title={format}
        className={buttonVariants({
          variant: isActive ? "primary" : "default",
          className: classNames(isActive && "text-white bg-neutral-700"),
        })}
      >
        {icon}
      </Popover.Trigger>

      <Popover.Content
        className={classNames(
          "z-50 p-4 bg-gray-200 rounded-md shadow-md dark:shadow-primary dropdown-fade w-70 dark:bg-primary dark:border dark:border-secondary",
        )}
      >
        <h3 className="text-xl font-semibold mb-5">{common(format)}</h3>

        <HexColorPicker onChange={setColor} color={color} />
        <Button className="w-full mt-5" onPress={() => handleSave(false)}>
          {common("ok")}
        </Button>

        <Popover.Arrow className="fill-primary" />
      </Popover.Content>
    </Popover.Root>
  );
}
