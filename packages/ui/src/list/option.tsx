import * as React from "react";
import { useOption } from "@react-aria/listbox";
import type { Node } from "@react-types/shared";
import type { ListState } from "@react-stately/list";
import { buttonSizes } from "../button";
import { classNames } from "../utils/classNames";

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
        "rounded-md my-1 hover:bg-secondary cursor-pointer",
        (isSelected || isFocused) && "bg-secondary",
        isDisabled && "cursor-not-allowed opacity-70",
      )}
    >
      {item.rendered}
    </li>
  );
}
