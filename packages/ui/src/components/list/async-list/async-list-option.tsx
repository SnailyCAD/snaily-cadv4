import * as React from "react";
import { useOption } from "@react-aria/listbox";
import type { Node } from "@react-types/shared";
import type { ListState } from "@react-stately/list";
import { buttonSizes } from "../../button";
import { classNames } from "../../../utils/classNames";
import { Check } from "react-bootstrap-icons";

interface OptionProps {
  item: Node<unknown>;
  state: ListState<unknown>;
}

export function AsyncListFieldOption(props: OptionProps) {
  const ref = React.useRef<HTMLLIElement>(null);
  const { optionProps, isDisabled, isFocused, isSelected } = useOption(
    { key: props.item.key },
    props.state,
    ref,
  );

  return (
    <li
      {...optionProps}
      ref={ref}
      className={classNames(
        buttonSizes.sm,
        "flex items-center justify-between",
        "rounded-md my-1 dark:text-white dark:hover:bg-secondary hover:bg-gray-400 focus:bg-gray-400 dark:focus:bg-secondary  cursor-pointer",
        (isSelected || isFocused) && "dark:bg-secondary bg-gray-400",
        isDisabled && "cursor-not-allowed opacity-70",
      )}
    >
      {props.item.rendered}
      {isSelected ? (
        <Check aria-label={`Selected ${props.item.textValue}`} className="dark:text-gray-400" />
      ) : null}
    </li>
  );
}
