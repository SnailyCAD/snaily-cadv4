import type * as React from "react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { classNames } from "lib/classNames";
import { Button, ButtonProps, buttonSizes, buttonVariants } from "components/Button";
import Link from "next/link";

interface Props extends DropdownMenu.MenuContentProps {
  trigger: any;
  children: React.ReactNode;
  extra?: { maxWidth?: number };
}

export function Dropdown({ trigger, children, extra, ...rest }: Props) {
  const maxWidth = extra?.maxWidth ?? 150;

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger className="flex items-center gap-1 px-1.5" asChild>
        {trigger}
      </DropdownMenu.Trigger>

      <DropdownMenu.Content
        sideOffset={7}
        alignOffset={10}
        style={{ width: maxWidth, maxWidth }}
        align="start"
        {...rest}
        className={classNames(
          rest.className ?? "dropdown-left",
          "z-50 p-1 bg-white rounded-md shadow-lg dropdown-fade w-36 dark:bg-dark-bright",
        )}
      >
        {children}
      </DropdownMenu.Content>
    </DropdownMenu.Root>
  );
}

Dropdown.Item = function DropdownItem({ children, ...rest }: Omit<ButtonProps, "ref">) {
  return (
    <DropdownMenu.Item asChild>
      <Button
        {...rest}
        variant="transparent"
        className={classNames(
          "my-0.5 rounded-md transition-colors w-full text-left bg-transparent",
          "dark:hover:bg-dark-bg focus:bg-gray-200 dark:focus:bg-dark-bg",
          rest.className,
        )}
      >
        {children}
      </Button>
    </DropdownMenu.Item>
  );
};

Dropdown.LinkItem = function LinkItem({ children, ...rest }: JSX.IntrinsicElements["a"]) {
  return (
    <DropdownMenu.Item className="hover:outline-none">
      <Link href={rest.href!}>
        <a
          className={classNames(
            "outline-none block rounded-md transition-colors w-full text-left bg-transparent",
            "dark:hover:bg-dark-bg focus:bg-gray-200 dark:focus:bg-dark-bg",
            buttonSizes.sm,
            buttonVariants.default,
            rest.className,
          )}
          {...rest}
        >
          {children}
        </a>
      </Link>
    </DropdownMenu.Item>
  );
};
