import * as React from "react";
import type { AriaSelectProps } from "@react-types/select";
import { Item } from "@react-stately/collections";
import { useTranslations } from "next-intl";
import { classNames } from "../utils/classNames";
import { Popover } from "../overlays/popover";
import { ListBox } from "../list/list-box";
import { Button, buttonSizes, buttonVariants } from "../button";
import { ChevronDown, X } from "react-bootstrap-icons";
import { useMultiSelectState } from "../hooks/select/useMultiSelectState";
import { useMultiSelect } from "../hooks/select/useMultiSelect";

export interface SelectValue {
  value: string;
  label: React.ReactNode;
  isDisabled?: boolean;
}

type Props<T extends SelectValue> = Omit<AriaSelectProps<T>, "children" | "selectedKey"> & {
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
  selectionMode?: "single" | "multiple";
};

export function SelectField<T extends SelectValue>(props: Props<T>) {
  const common = useTranslations("Common");
  const optionalText = common("optionalField");
  const selectionMode = props.selectionMode ?? "single";

  const children = React.useMemo(() => {
    return props.options.map((option) => <Item key={option.value}>{option.label}</Item>);
  }, [props.options]);

  const disabledKeys = React.useMemo(() => {
    return props.options.filter((v) => Boolean(v.isDisabled)).map((v) => v.value);
  }, [props.options]);

  const selectedKeys = React.useMemo(() => {
    if (props.selectedKeys === "all") {
      return "all";
    }

    if (props.selectedKeys instanceof Set) {
      return props.selectedKeys;
    }

    if (Array.isArray(props.selectedKeys)) {
      return props.selectedKeys;
    }

    return [props.selectedKeys];
  }, [props.selectedKeys]);

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
    { ...props, disallowEmptySelection, children, disabledKeys },
    state,
    ref,
  );

  const selectedItems = selectionMode === "multiple" ? state.selectedItems : null;
  const selectedItem = selectionMode === "single" ? state.selectedItems?.[0] : null;

  return (
    <div className={classNames("flex flex-col mb-3", props.className)}>
      <label
        {...labelProps}
        className={classNames(
          "mb-1 dark:text-white",
          props.hiddenLabel && "sr-only",
          props.labelClassnames,
        )}
      >
        {props.label}{" "}
        {props.isOptional ? <span className="text-sm italic">({optionalText})</span> : null}
      </label>

      <div className="relative">
        <Button
          {...triggerProps}
          className={classNames(
            buttonVariants.default,
            buttonSizes.sm,
            "rounded-md w-full h-10 flex items-center justify-between border dark:!border-gray-700 !bg-white !border-gray-200 dark:!bg-secondary hover:!border-gray-500 hover:dark:!bg-secondary hover:dark:!brightness-100",
            state.isOpen && "dark:!border-gray-500 !border-gray-500",
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
            {selectedItems ? (
              selectedItems.map((item) => (
                <span
                  className="text-sm flex items-center justify-between p-0.5 px-1.5 rounded-sm bg-tertiary h-7"
                  key={item.key}
                >
                  <span className="pr-1">{item.textValue}</span>
                  <Button
                    className="!px-0.5 hover:!bg-primary"
                    variant="transparent"
                    role="button"
                    onPress={() => {
                      const copied = [...state.selectedKeys].filter((v) => v !== item.key);
                      state.setSelectedKeys(copied);
                    }}
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </span>
              ))
            ) : selectedItem ? (
              <span>{selectedItem.textValue}</span>
            ) : (
              common("select")
            )}
          </div>
          <div className="flex items-center">
            {props.isClearable && selectedItems ? (
              <>
                <Button
                  variant="transparent"
                  className="dark:text-gray-400 hover:!text-white !px-0"
                  aria-label="Clear"
                  onPress={() => {
                    state.setSelectedKeys([]);
                  }}
                >
                  <X className="h-6 w-6" />
                </Button>
                <div className="w-[1px] h-4 rounded-md dark:bg-gray-500/80 mx-1" />
              </>
            ) : null}
            <span aria-hidden="true" style={{ paddingLeft: 5 }}>
              <ChevronDown />
            </span>
          </div>
        </Button>
        {state.isOpen && (
          <Popover isOpen={state.isOpen} onClose={state.close}>
            <ListBox {...menuProps} state={state} />
          </Popover>
        )}
      </div>

      {props.children}
      {props.errorMessage && (
        <span {...errorMessageProps} className="mt-1 font-medium text-red-500">
          {props.errorMessage}
        </span>
      )}
    </div>
  );
}
