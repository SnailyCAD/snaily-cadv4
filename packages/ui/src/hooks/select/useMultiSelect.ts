import { setInteractionModality } from "@react-aria/interactions";
import { useField } from "@react-aria/label";
import { useMenuTrigger } from "@react-aria/menu";
import { filterDOMProps, mergeProps, useId } from "@react-aria/utils";
import type * as React from "react";

import type {
  MultiSelectProps as MultiSelectStateProps,
  MultiSelectState,
} from "./useMultiSelectState";
import type { AriaSelectProps } from "@react-types/select";

interface MultiSelectProps<T> extends Omit<AriaSelectProps<T>, "onSelectionChange"> {
  disallowEmptySelection?: boolean;
  onSelectionChange?: MultiSelectStateProps<T>["onSelectionChange"];
}

export function useMultiSelect<T>(
  props: MultiSelectProps<T>,
  state: MultiSelectState<T>,
  ref: React.RefObject<HTMLElement>,
) {
  const { disallowEmptySelection, isDisabled } = props;

  const { menuTriggerProps, menuProps } = useMenuTrigger(
    { isDisabled, type: "listbox" },
    state,
    ref,
  );

  const { labelProps, errorMessageProps, fieldProps } = useField({
    ...props,
    labelElementType: "span",
  });

  const domProps = filterDOMProps(props, { labelable: true });
  const triggerProps = mergeProps(menuTriggerProps, fieldProps);
  const valueId = useId();

  return {
    errorMessageProps,
    labelProps: {
      ...labelProps,
      onClick: () => {
        if (!props.isDisabled) {
          ref.current?.focus();

          setInteractionModality("keyboard");
        }
      },
    },
    triggerProps: mergeProps(domProps, { ...triggerProps }),
    valueProps: { id: valueId },
    menuProps: {
      ...menuProps,
      disallowEmptySelection,
      shouldSelectOnPressUp: true,
    },
  };
}
