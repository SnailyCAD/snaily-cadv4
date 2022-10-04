import * as Menu from "@radix-ui/react-context-menu";
import type * as React from "react";
import { v4 } from "uuid";
import { classNames } from "lib/classNames";
import { useModal } from "state/modalState";

interface Props {
  items: (ContextItem | boolean)[];
  asChild?: boolean;
  canBeOpened?: boolean;
  children: React.ReactNode;
}

type ButtonProps = React.DetailedHTMLProps<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  HTMLButtonElement
>;

export interface ContextItem extends ButtonProps {
  name: string;
  component?: keyof typeof components;
}

export function ContextMenu({ items, canBeOpened = true, asChild, children }: Props) {
  const { canBeClosed, setCanBeClosed } = useModal();

  function handleClick(item: ContextItem, e: React.MouseEvent<HTMLButtonElement>) {
    item.onClick?.(e);
    setCanBeClosed(true);
  }

  if (!canBeOpened) {
    return children as JSX.Element;
  }

  return (
    <Menu.Root
      modal={!canBeClosed}
      onOpenChange={(open) => {
        if (open) {
          setCanBeClosed(false);
        } else {
          setTimeout(() => setCanBeClosed(true), 50);
        }
      }}
    >
      <Menu.Trigger asChild={asChild}>{children}</Menu.Trigger>

      <Menu.Content
        alignOffset={5}
        className={classNames(
          "flex flex-col z-50",
          "shadow-sm shadow-primary",
          "bg-white dark:bg-primary border dark:border-secondary",
          "p-2 rounded-md min-w-[15rem] max-h-[25rem] overflow-auto",
        )}
        style={{ scrollbarWidth: "thin" }}
      >
        {items.map((item) => {
          const { component = "Item", ...rest } = typeof item === "object" ? item : {};
          const Component = components[component];

          return typeof item === "boolean" ? (
            <Menu.Separator key={v4()} />
          ) : (
            <Component
              key={v4()}
              onPress={component === "Item" ? handleClick.bind(null, item) : undefined}
              {...rest}
            >
              {item.name}
            </Component>
          );
        })}
      </Menu.Content>
    </Menu.Root>
  );
}

const components = {
  Item: ({ children, ...rest }: any) => (
    <Menu.Item
      {...rest}
      className={classNames(
        "block",
        "rounded-sm px-3 py-1 my-0.5",
        "dark:text-white",
        "hover:bg-white/[0.12] dark:hover:bg-white/[0.05]",
        "active:bg-white/[0.12] dark:active:bg-white/[0.05]",
        "focus:bg-white/[0.12] dark:focus:bg-white/[0.05]",
        "cursor-pointer",
        rest.className,
      )}
    >
      {children}
    </Menu.Item>
  ),
  Label: ({ children, ...rest }: any) => (
    <Menu.Label
      className={classNames(
        "block",
        "rounded-sm px-3 py-1 my-0.5",
        "dark:text-white bg",
        "font-semibold text-lg",
        rest.className,
      )}
      {...rest}
    >
      {children}
    </Menu.Label>
  ),
};
