import * as React from "react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { classNames } from "lib/classNames";
import { Button, ButtonProps, buttonSizes, buttonVariants } from "@snailycad/ui";
import Link from "next/link";

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

Dropdown.Item = function DropdownItem({
  children,
  closeOnClick = true,
  ...rest
}: Omit<ButtonProps, "ref"> & { closeOnClick?: boolean }) {
  function handleClick(e: React.MouseEvent<HTMLButtonElement>) {
    if (!closeOnClick) {
      e.preventDefault();
      rest.onClick?.(e);
    } else {
      rest.onClick?.(e);
    }
  }

  return (
    <DropdownMenu.Item asChild>
      <Button
        {...rest}
        onClick={handleClick}
        variant="transparent"
        className={classNames(
          "my-0.5 rounded-md transition-colors w-full text-left bg-transparent",
          "hover:bg-gray-400 focus:bg-gray-400 dark:hover:bg-secondary dark:focus:bg-secondary",
          rest.className,
        )}
      >
        {children}
      </Button>
    </DropdownMenu.Item>
  );
};

Dropdown.LinkItem = function LinkItem({
  children,
  ...rest
}: Omit<JSX.IntrinsicElements["a"], "ref">) {
  return (
    <DropdownMenu.Item className="hover:outline-none">
      <Link
        {...rest}
        className={classNames(
          "outline-none block rounded-md transition-colors w-full text-left bg-transparent",
          "dark:hover:bg-secondary hover:bg-gray-400 focus:bg-gray-400 dark:focus:bg-secondary",
          buttonSizes.sm,
          buttonVariants.transparent,
          rest.className,
        )}
        href={rest.href!}
      >
        {children}
      </Link>
    </DropdownMenu.Item>
  );
};
