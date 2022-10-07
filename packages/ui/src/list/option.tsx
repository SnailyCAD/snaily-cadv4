import * as React from "react";
import { useOption } from "@react-aria/listbox";
import type { Node } from "@react-types/shared";
import type { ListState } from "@react-stately/list";
import { buttonSizes } from "../button";
import { classNames } from "../utils/classNames";
import { Check } from "react-bootstrap-icons";

interface OptionProps {
  item: Node<unknown>;
  state: ListState<unknown>;
}

export function Option({ item, state }: OptionProps) {
  const ref = React.useRef<HTMLLIElement>(null);
  const { optionProps, isDisabled, isFocused, isSelected } = useOption(
    { key: item.key },
    state,
    ref,
  );

  return (
    <li
      {...optionProps}
      ref={ref}
      className={classNames(
        buttonSizes.sm,
        "flex items-center justify-between",
        "rounded-md my-1 dark:text-white hover:bg-secondary focus:bg-secondary cursor-pointer",
        (isSelected || isFocused) && "bg-secondary",
        isDisabled && "cursor-not-allowed opacity-70",
      )}
    >
      {item.rendered}
      {isSelected ? <Check className="dark:text-gray-400" /> : null}
    </li>
  );
}
