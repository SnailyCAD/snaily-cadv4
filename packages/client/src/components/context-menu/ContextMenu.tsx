import * as Menu from "@radix-ui/react-context-menu";
import * as React from "react";
import { v4 } from "uuid";
import { classNames } from "lib/classNames";
import { useModal } from "context/ModalContext";

interface Props {
  items: (ContextItem | boolean)[];
  children: React.ReactChild;
}

type ButtonProps = React.DetailedHTMLProps<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  HTMLButtonElement
>;

interface ContextItem extends ButtonProps {
  name: string;
  component?: string;
}

export const ContextMenu = ({ items, children }: Props) => {
  const { canBeClosed, setCanBeClosed } = useModal();

  function handleClick(item: ContextItem, e: React.MouseEvent<HTMLButtonElement, MouseEvent>) {
    item.onClick?.(e);
    setCanBeClosed(true);
  }

  return (
    <Menu.Root
      modal={!canBeClosed}
      onOpenChange={(open) => {
        if (open === true) {
          setCanBeClosed(false);
        } else {
          setTimeout(() => setCanBeClosed(true), 50);
        }
      }}
    >
      <Menu.Trigger>{children}</Menu.Trigger>

      <Menu.Content
        alignOffset={5}
        className={classNames(
          "flex flex-col",
          "shadow-md",
          "bg-white dark:bg-dark-bright shadow-sm",
          "p-1.5 rounded-md w-36",
        )}
      >
        {items.map((item) => {
          const { component = "Item", ...rest } = typeof item === "object" ? item : {};
          const Component = components[component] ?? components.Item;

          return typeof item === "boolean" ? (
            <Menu.Separator key={v4()} />
          ) : Component ? (
            <Component key={v4()} onClick={handleClick.bind(null, item)} {...rest}>
              {item.name}
            </Component>
          ) : null;
        })}

        {/* <Menu.Label>hello world</Menu.Label>

        <Menu.Group>
          <Menu.Item>my text</Menu.Item>
          <Menu.Item>my text</Menu.Item>
          <Menu.Item>my text</Menu.Item>
          <Menu.Item>my text</Menu.Item>
        </Menu.Group>

        <Menu.CheckboxItem>
          <Menu.ItemIndicator>test</Menu.ItemIndicator>
        </Menu.CheckboxItem>

        <Menu.RadioGroup>
          <Menu.RadioItem value={"true"}>
            <Menu.ItemIndicator>test</Menu.ItemIndicator>
          </Menu.RadioItem>
        </Menu.RadioGroup> */}

        {/* <Menu.Root>
          <Menu.TriggerItem />
          <Menu.Content />
        </Menu.Root> */}
      </Menu.Content>
    </Menu.Root>
  );
};

const components: Record<string, (...args: any[]) => any> = {
  Item: ({ children, ...rest }: any) => (
    <Menu.Item
      {...rest}
      className={classNames(
        "block",
        "rounded-sm px-2 py-1",
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
};
