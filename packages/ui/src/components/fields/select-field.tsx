import * as React from "react";
import type { AriaSelectProps } from "@react-types/select";
import { Item } from "@react-stately/collections";
import { ModalProvider } from "@react-aria/overlays";
import { classNames } from "../../utils/classNames";
import { Popover } from "../overlays/popover";
import { ListBox } from "../list/list-box";
import { Button, buttonSizes, buttonVariants } from "../button";
import { useMultiSelectState } from "../../hooks/select/useMultiSelectState";
import { useMultiSelect } from "../../hooks/select/useMultiSelect";
import { getSelectedKeyOrKeys } from "../../utils/select/getSelectedKeyOrKeys";
import { SelectedItems } from "../inputs/select/selected-items";
import { SelectActions } from "../inputs/select/select-actions";
import { ErrorMessage } from "../error-message";
import { Label } from "../label";

export interface SelectValue {
  value: string;
  label: React.ReactNode;
  isDisabled?: boolean;
}

export type SelectFieldProps<T extends SelectValue> = Omit<
  AriaSelectProps<T>,
  "children" | "selectedKey"
> & {
  label: string;
  isClearable?: boolean;
  isOptional?: boolean;
  children?: React.ReactNode;
  options: T[];
  className?: string;
  labelClassnames?: string;
  hiddenLabel?: boolean;

  onSelectionChange?: Parameters<typeof useMultiSelectState>["0"]["onSelectionChange"];
  selectedKeys?: Parameters<typeof useMultiSelectState>["0"]["selectedKeys"];
  selectedKey?: React.Key | null;
  selectionMode?: "single" | "multiple";
};

export function SelectField<T extends SelectValue>(props: SelectFieldProps<T>) {
  const selectionMode = props.selectionMode ?? "single";

  const children = React.useMemo(() => {
    return props.options.map((option) => <Item key={option.value}>{option.label}</Item>);
  }, [props.options]);

  const disabledKeys = React.useMemo(() => {
    return props.options.filter((v) => Boolean(v.isDisabled)).map((v) => v.value);
  }, [props.options]);

  const selectedKeys = React.useMemo(
    () =>
      getSelectedKeyOrKeys({ selectedKey: props.selectedKey, selectedKeys: props.selectedKeys }),
    [props.selectedKeys, props.selectedKey],
  );

  const disallowEmptySelection = !props.isClearable;
  const state = useMultiSelectState({
    ...props,
    selectedKeys,
    children,
    disabledKeys,
    disallowEmptySelection,
    selectionMode,
  });

  const ref = React.useRef<null>(null);
  const { labelProps, triggerProps, errorMessageProps, valueProps, menuProps } = useMultiSelect(
    { ...props, selectedKey: undefined, disallowEmptySelection, children, disabledKeys },
    state,
    ref,
  );

  const selectedItems = selectionMode === "multiple" ? state.selectedItems : null;
  const selectedItem = selectionMode === "single" ? state.selectedItems?.[0] : null;

  return (
    <ModalProvider>
      <div className={classNames("flex flex-col mb-3", props.className)}>
        <Label {...props} labelProps={labelProps} />
        <div className="relative">
          <Button
            {...triggerProps}
            className={classNames(
              buttonVariants.default,
              buttonSizes.sm,
              "cursor-default rounded-md w-full h-10 flex items-center justify-between border !bg-white dark:!bg-secondary hover:dark:!bg-secondary hover:dark:!brightness-100",
              (state.isOpen || state.isFocused) &&
                !props.isDisabled &&
                "dark:!border-gray-500 !border-gray-500",
              props.isDisabled && "!cursor-not-allowed opacity-80",
              props.errorMessage
                ? "!border-red-500 focus:!border-red-700 dark:focus:!border-red-700"
                : "dark:!border-gray-700 !border-gray-200 hover:!border-gray-500",
            )}
            ref={ref}
          >
            <div
              {...valueProps}
              className={classNames(
                "flex items-center gap-2",
                !(selectedItems || selectedItem) && "text-neutral-700 dark:text-gray-400",
              )}
            >
              <SelectedItems selectionMode={selectionMode} state={state} />
            </div>
            <SelectActions
              selectionMode={selectionMode}
              state={state}
              isClearable={props.isClearable}
            />
          </Button>
          {state.isOpen && (
            <Popover isOpen={state.isOpen} onClose={state.close}>
              <ListBox {...menuProps} state={state} />
            </Popover>
          )}
        </div>
        {props.children}
        {props.errorMessage && (
          <ErrorMessage errorMessage={props.errorMessage} errorMessageProps={errorMessageProps} />
        )}
      </div>
    </ModalProvider>
  );
}
