import * as React from "react";
import { useComboBox } from "@react-aria/combobox";
import { useComboBoxState } from "@react-stately/combobox";
import { Item } from "@react-stately/collections";
import type { ComboBoxProps } from "@react-types/combobox";
import { Label } from "../label";
import { Input } from "../inputs/input";
import { ErrorMessage } from "../error-message";
import { AsyncListFieldListBox } from "../list/async-list/async-list-list-box";
import { useAsyncList } from "@react-stately/data";
import { USER_API_TOKEN_HEADER } from "@snailycad/config";
import type { Key } from "@react-types/shared";

import { useDebounce } from "react-use";
import type { Node } from "@react-types/shared";
import { useTranslations } from "next-intl";
import { Loader } from "../loader";
import { getAPIUrl } from "@snailycad/utils/api-url";
import { AsyncListSearchFieldActions } from "./async-list-search-field/actions";
import { cn } from "mxcn";
import { Popover } from "..";
import type { AriaPopoverProps } from "@react-aria/overlays";

interface AsyncListFieldFetchOptions {
  filterTextRequired?: boolean;
  apiPath: string | ((query: string | undefined) => string);
  method?: "POST" | "GET" | null;
  bodyKey?: string;
  url?: string;
  userApiToken?: string;
  onResponse?(json: any): any[];
}

export interface AsyncListFieldProps<T extends object>
  extends Omit<ComboBoxProps<T>, "onSelectionChange" | "onInputChange"> {
  label: React.ReactNode;
  isOptional?: boolean;
  isClearable?: boolean;
  filterFn?(value: T, index: number): boolean;

  errorMessage?: string | null;
  className?: string;
  /** className that will be appended in the results menu */
  menuClassName?: string;
  menuPlacement?: AriaPopoverProps["placement"];

  fetchOptions: AsyncListFieldFetchOptions;

  /** the value that handles the input value */
  localValue: string;
  onInputChange(value: string): void;
  onSelectionChange(node: Node<T> | null): void;
}

function AsyncListSearchField<T extends object>(props: AsyncListFieldProps<T>) {
  const triggerRef = React.useRef<HTMLDivElement | null>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const listBoxRef = React.useRef<HTMLUListElement | null>(null);
  const popoverRef = React.useRef<HTMLDivElement | null>(null);
  const buttonRef = React.useRef<HTMLButtonElement | null>(null);
  const common = useTranslations("Common");

  const list = useAsyncList<T>({
    async load({ signal, filterText }) {
      if (props.fetchOptions.filterTextRequired && !filterText) {
        return { items: [] };
      }

      const apiPath =
        typeof props.fetchOptions.apiPath === "string"
          ? props.fetchOptions.apiPath
          : props.fetchOptions.apiPath(filterText);

      const body = props.fetchOptions.bodyKey
        ? { [props.fetchOptions.bodyKey]: filterText }
        : undefined;

      const url = props.fetchOptions.url ?? getAPIUrl();
      const res = await fetch(`${url}${apiPath}`, {
        credentials: "include",
        signal,
        method: props.fetchOptions.method ?? "GET",
        body: body && props.fetchOptions.method === "POST" ? JSON.stringify(body) : undefined,
        headers: {
          "content-type": "application/json",
          ...(props.fetchOptions.userApiToken
            ? { [USER_API_TOKEN_HEADER]: props.fetchOptions.userApiToken }
            : {}),
        },
      });

      const json = await res.json();
      const itemsArray = Array.isArray(json) ? json : (props.fetchOptions.onResponse?.(json) ?? []);

      return {
        items: itemsArray,
      };
    },
  });

  useDebounce(
    () => {
      list.setFilterText(state.inputValue);
    },
    200,
    [props.localValue],
  );

  function handleSelectionChange(key?: Key | null, value?: string) {
    try {
      if (props.isClearable && key === "cleared") {
        props.onSelectionChange(null);
        props.onInputChange("");
        return;
      }

      if (!key) {
        // if there are no items to select from, and the value is empty, then we should clear the value
        // only if we do not allow custom values
        if (list.items.length <= 0 && !value && !props.allowsCustomValue) {
          return;
        }

        return;
      }

      const item = state.collection.getItem(key) as Node<T> | null;
      if (item) {
        props.onSelectionChange(item);
      }
    } catch (err) {
      console.error(err);
    }
  }

  const listOptions = {
    items: props.filterFn
      ? list.items.filter((value, index) => props.filterFn?.(value, index))
      : list.items,
    inputValue: props.localValue,
    onInputChange: props.onInputChange,
  };

  const state = useComboBoxState({
    ...props,
    ...listOptions,
    shouldCloseOnBlur: true,
    allowsEmptyCollection: true,
    onSelectionChange: handleSelectionChange,
  });

  const { inputProps, listBoxProps, errorMessageProps, labelProps } = useComboBox(
    {
      ...props,
      onSelectionChange: handleSelectionChange,
      inputRef,
      listBoxRef,
      popoverRef,
      buttonRef,
    },
    state,
  );

  const showClearableButton = Boolean(props.isClearable && state.selectedKey);

  return (
    <div className={cn("text-field flex flex-col mb-3", props.className)}>
      <Label {...props} labelProps={labelProps} />

      <div ref={triggerRef} className="relative group flex">
        <Input
          {...inputProps}
          ref={inputRef}
          errorMessage={props.errorMessage}
          className={cn(
            inputProps.className,
            "-mr-[1px] rounded-r-none",
            !props.isDisabled && "group-hover:dark:!border-gray-500 group-hover:!border-gray-500",
          )}
        />

        {list.isLoading ? (
          <span
            aria-hidden
            className={cn(
              "absolute top-0 bottom-0 flex items-center justify-center",
              showClearableButton ? "right-20" : "right-11",
            )}
          >
            <Loader />
          </span>
        ) : null}

        <AsyncListSearchFieldActions
          buttonRef={buttonRef}
          showClearableButton={showClearableButton}
          errorMessage={props.errorMessage}
          state={state}
          isDisabled={props.isDisabled}
        />

        {state.isOpen ? (
          <Popover
            triggerRef={triggerRef}
            className={props.menuClassName}
            state={state}
            popoverRef={popoverRef}
            placement={props.menuPlacement}
          >
            {state.collection.size > 0 ? (
              <AsyncListFieldListBox<T> {...listBoxProps} listBoxRef={listBoxRef} state={state} />
            ) : (
              <p className="cursor-default text-base text-neutral-700 dark:text-gray-400">
                {state.inputValue === ""
                  ? common("startTyping")
                  : list.loadingState === "filtering"
                    ? common("searching")
                    : common("noOptions")}
              </p>
            )}
          </Popover>
        ) : null}
      </div>

      {!!props.errorMessage && (
        <ErrorMessage errorMessage={props.errorMessage} errorMessageProps={errorMessageProps} />
      )}
    </div>
  );
}

export { Item, AsyncListSearchField };
