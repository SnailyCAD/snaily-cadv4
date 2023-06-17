import * as React from "react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { classNames } from "lib/classNames";

interface Props extends DropdownMenu.MenuContentProps, DropdownMenu.DropdownMenuProps {
  trigger: any;
  children: React.ReactNode;
  extra?: { maxWidth?: number };
}

export function Dropdown({ trigger, children, extra, open, modal, onOpenChange, ...rest }: Props) {
  const maxWidth = extra?.maxWidth ?? 175;
  const Portal = modal ? DropdownMenu.Portal : React.Fragment;

  return (
    <DropdownMenu.Root modal={modal} open={open} onOpenChange={onOpenChange}>
      <DropdownMenu.Trigger className="flex items-center gap-1 px-1.5" asChild>
        {trigger}
      </DropdownMenu.Trigger>

      <Portal>
        <DropdownMenu.Content
          sideOffset={7}
          alignOffset={10}
          style={{ width: maxWidth, maxWidth }}
          align="start"
          {...rest}
          className={classNames(
            rest.className ?? "dropdown-left",
            "flex flex-col z-50 p-2 bg-gray-100 rounded-md shadow-md dark:shadow-primary dropdown-fade w-40 dark:bg-primary border border-secondary",
          )}
        >
          {children}
        </DropdownMenu.Content>
      </Portal>
    </DropdownMenu.Root>
  );
}
