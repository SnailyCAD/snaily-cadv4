import * as React from "react";
import { HiddenSelect, useSelect } from "@react-aria/select";
import { useSelectState } from "@react-stately/select";
import type { AriaSelectProps } from "@react-types/select";
import { Item } from "@react-stately/collections";
import { useTranslations } from "next-intl";
import { classNames } from "../utils/classNames";
import { Popover } from "../overlays/popover";
import { ListBox } from "../list/list-box";
import { Button } from "../button";
import { ChevronDown } from "react-bootstrap-icons";

export interface SelectValue {
  value: string;
  label: React.ReactNode;
  isDisabled?: boolean;
}

interface Props<T extends SelectValue> extends Omit<AriaSelectProps<T>, "children"> {
  label: string;

  children?: React.ReactNode;
  options: T[];
  isOptional?: boolean;
  className?: string;
  labelClassnames?: string;
  hiddenLabel?: boolean;
}

export function SelectField<T extends SelectValue>(props: Props<T>) {
  const optionalText = useTranslations("Common")("optionalField");

  const children = React.useMemo(() => {
    return props.options.map((option) => <Item key={option.value}>{option.label}</Item>);
  }, [props.options]);

  const disabledKeys = React.useMemo(() => {
    return props.options.filter((v) => Boolean(v.isDisabled)).map((v) => v.value);
  }, [props.options]);

  const state = useSelectState<T>({ ...props, children, disabledKeys });
  const ref = React.useRef<null>(null);
  const { labelProps, errorMessageProps, triggerProps, valueProps, menuProps } = useSelect(
    { ...props, children },
    state,
    ref,
  );

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
        <HiddenSelect state={state} triggerRef={ref} label={props.label} name={props.name} />
        <Button
          {...triggerProps}
          className={classNames(
            "w-full h-10 flex items-center justify-between !border-gray-200 dark:!border-gray-700 dark:!bg-secondary hover:!bg-gray-500 hover:dark:!bg-secondary hover:dark:!brightness-100 hover:!border-gray-800",
            state.isOpen && "dark:!border-gray-500",
          )}
          ref={ref}
        >
          <span {...valueProps}>
            {/* eslint-disable-next-line @typescript-eslint/no-unnecessary-condition */}
            {state.selectedItem ? state.selectedItem.rendered : "Select an option"}
          </span>
          <span aria-hidden="true" style={{ paddingLeft: 5 }}>
            <ChevronDown />
          </span>
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
