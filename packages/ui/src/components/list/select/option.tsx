import * as React from "react";
import { useOption } from "@react-aria/listbox";
import type { Node } from "@react-types/shared";
import type { ListState } from "@react-stately/list";
import { cn } from "mxcn";
import { Check } from "react-bootstrap-icons";
import { buttonVariants } from "../../button/button";

interface OptionProps {
  item: Node<unknown>;
  state: ListState<unknown>;
}

export function Option(props: OptionProps) {
  const ref = React.useRef<HTMLLIElement>(null);
  const { optionProps, isDisabled, isSelected, isFocusVisible } = useOption(
    { key: props.item.key },
    props.state,
    ref,
  );

  return (
    <li
      {...optionProps}
      ref={ref}
      className={buttonVariants({
        variant: "transparent",
        size: "md",
        className: cn(
          "flex items-center justify-between my-1 hover:bg-gray-300 dark:hover:bg-secondary focus:bg-gray-300 dark:focus:bg-secondary",
          (isSelected || isFocusVisible) && "dark:bg-secondary bg-gray-300",
          isDisabled && "cursor-not-allowed opacity-70",
        ),
      })}
    >
      {props.item.rendered}
      {isSelected ? (
        <Check aria-label={`Selected ${props.item.textValue}`} className="dark:text-gray-400" />
      ) : null}
    </li>
  );
}
