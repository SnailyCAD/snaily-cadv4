import * as React from "react";
import { useComboBox } from "@react-aria/combobox";
import { useComboBoxState } from "@react-stately/combobox";
import { Item } from "@react-stately/collections";
import type { ComboBoxProps } from "@react-types/combobox";

import { classNames } from "../../utils/classNames";
import { Label } from "../label";
import { Input } from "../inputs/input";
import { ErrorMessage } from "../error-message";
import { Popover } from "../overlays/async-list/popover";
import { AsyncListFieldListBox } from "../list/async-list/async-list-list-box";
import { useFilter } from "@react-aria/i18n";
import { useAsyncList } from "@react-stately/data";
import { Button } from "../button";
import { ChevronDown } from "react-bootstrap-icons";
import { useDebounce } from "react-use";

interface AsyncListFieldFetchOptions {
  apiPath: string | ((query: string | undefined) => string);
  method?: "POST" | "GET" | null;
  bodyKey?: string;
}

export interface AsyncListFieldProps<T extends object> extends ComboBoxProps<T> {
  label: React.ReactNode;
  isOptional?: boolean;

  errorMessage?: string | null;
  className?: string;
  includeMenu?: boolean;

  fetchOptions: AsyncListFieldFetchOptions;
}

export function AsyncListSearchField<T extends object>(props: AsyncListFieldProps<T>) {
  const [localValue, setLocalValue] = React.useState("");

  const ref = React.useRef<any>(null);
  const listBoxRef = React.useRef<HTMLUListElement | null>(null);
  const popoverRef = React.useRef<HTMLDivElement | null>(null);
  const buttonRef = React.useRef<HTMLButtonElement | null>(null);
  const includeMenu = props.includeMenu ?? true;

  const list = useAsyncList<T>({
    async load({ signal, filterText }) {
      const apiPath =
        typeof props.fetchOptions.apiPath === "string"
          ? props.fetchOptions.apiPath
          : props.fetchOptions.apiPath(filterText);

      const body = props.fetchOptions.bodyKey
        ? { [props.fetchOptions.bodyKey]: filterText }
        : undefined;

      const res = await fetch(`${getAPIUrl()}${apiPath}`, {
        credentials: "include",
        signal,
        method: props.fetchOptions.method ?? "GET",
        body: body && props.fetchOptions.method === "POST" ? JSON.stringify(body) : undefined,
      });
      const json = await res.json();
      const itemsArray = Array.isArray(json) ? json : [];

      return {
        items: itemsArray,
      };
    },
  });

  useDebounce(
    () => {
      list.setFilterText(localValue);
    },
    200,
    [localValue],
  );

  const listOptions = {
    items: list.items,
    inputValue: localValue,
    onInputChange: setLocalValue,
  };

  const { contains } = useFilter({ sensitivity: "base" });
  const state = useComboBoxState({
    ...props,
    ...listOptions,
    allowsCustomValue: false,
    defaultFilter: contains,
  });

  const { buttonProps, inputProps, listBoxProps, errorMessageProps, labelProps } = useComboBox(
    {
      ...props,
      inputRef: ref,
      listBoxRef,
      popoverRef,
      buttonRef,
    },
    state,
  );

  return (
    <div className={classNames("text-field flex flex-col mb-3", props.className)}>
      <Label element="span" {...props} labelProps={labelProps} />

      <div className={classNames("relative", includeMenu && "flex")}>
        <Input
          {...inputProps}
          ref={ref}
          errorMessage={props.errorMessage}
          className={classNames(inputProps.className, includeMenu && "rounded-r-none")}
        />
        {includeMenu ? (
          <Button
            {...buttonProps}
            className={classNames(
              "!rounded-l-none !border-l-0 px-2",
              props.errorMessage &&
                "!border-red-500 focus:!border-red-700 dark:!focus:border-red-700",
            )}
            type="button"
          >
            <ChevronDown />
          </Button>
        ) : null}
        {includeMenu && state.isOpen ? (
          <Popover isOpen={state.isOpen} onClose={state.close} popoverRef={popoverRef}>
            <AsyncListFieldListBox {...listBoxProps} listBoxRef={listBoxRef} state={state} />
          </Popover>
        ) : null}
      </div>

      {props.errorMessage && (
        <ErrorMessage errorMessage={props.errorMessage} errorMessageProps={errorMessageProps} />
      )}
    </div>
  );
}

export { Item };

// todo: place in `@snailycad/utils`
export function getAPIUrl() {
  const envUrl = process.env.NEXT_PUBLIC_PROD_ORIGIN ?? "http://localhost:8080/v1";
  console.log(envUrl);

  if (process.env.NODE_ENV === "development") {
    return "http://localhost:8080/v1";
  }

  return envUrl;
}
