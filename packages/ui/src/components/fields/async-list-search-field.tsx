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
import { useAsyncList } from "@react-stately/data";
import { Button } from "../button";
import { ChevronDown, X } from "react-bootstrap-icons";
import { useDebounce } from "react-use";
import type { Node } from "@react-types/shared";
import { useTranslations } from "next-intl";
import { Loader } from "../loader";
import { getAPIUrl } from "@snailycad/utils/api-url";

interface AsyncListFieldFetchOptions {
  filterTextRequired?: boolean;
  apiPath: string | ((query: string | undefined) => string);
  method?: "POST" | "GET" | null;
  bodyKey?: string;
}

export interface AsyncListFieldProps<T extends object>
  extends Omit<ComboBoxProps<T>, "onSelectionChange"> {
  label: React.ReactNode;
  isOptional?: boolean;
  isClearable?: boolean;
  filterFn?: any;

  errorMessage?: string | null;
  className?: string;
  includeMenu?: boolean;
  menuClassName?: string;

  fetchOptions: AsyncListFieldFetchOptions;

  localValue: string;
  setValues(values: { localValue?: string; node?: Node<T> | null }): void;
}

function AsyncListSearchField<T extends object>(props: AsyncListFieldProps<T>) {
  const ref = React.useRef<any>(null);
  const listBoxRef = React.useRef<HTMLUListElement | null>(null);
  const popoverRef = React.useRef<HTMLDivElement | null>(null);
  const buttonRef = React.useRef<HTMLButtonElement | null>(null);
  const includeMenu = props.includeMenu ?? true;
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

      const res = await fetch(`${getAPIUrl()}${apiPath}`, {
        credentials: "include",
        signal,
        method: props.fetchOptions.method ?? "GET",
        body: body && props.fetchOptions.method === "POST" ? JSON.stringify(body) : undefined,
        headers: {
          "content-type": "application/json",
        },
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
      list.setFilterText(state.inputValue);
    },
    200,
    [props.localValue],
  );

  function handleSelectionChange(key?: React.Key, value?: string) {
    if (props.isClearable && key === "cleared") {
      props.setValues({ localValue: "", node: null });
      return;
    }

    if (!key) {
      props.setValues({ localValue: value });
      return;
    }

    const item = state.collection.getItem(key) as Node<T> | null;

    if (item) {
      props.setValues({ localValue: item.textValue, node: item });
    }
  }

  const listOptions = {
    items: props.filterFn ? list.items.filter(props.filterFn) : list.items,
    inputValue: props.localValue,
    onInputChange: (value: string) => handleSelectionChange(undefined, value),
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
      inputRef: ref,
      listBoxRef,
      popoverRef,
      buttonRef,
    },
    state,
  );

  const showClearableButton = props.isClearable && state.selectedKey;

  return (
    <div className={classNames("text-field flex flex-col mb-3", props.className)}>
      <Label {...props} labelProps={labelProps} />

      <div className={classNames("relative group", includeMenu && "flex")}>
        <Input
          {...inputProps}
          ref={ref}
          errorMessage={props.errorMessage}
          className={classNames(
            inputProps.className,
            "-mr-[1px]",
            includeMenu && "rounded-r-none",
            "group-hover:dark:!border-gray-500 group-hover:!border-gray-500",
          )}
        />
        {list.isLoading ? (
          <div
            className={classNames(
              "absolute top-0 bottom-0 flex items-center justify-center",
              includeMenu ? (showClearableButton ? "right-20" : "right-11") : "right-2",
            )}
          >
            <Loader />
          </div>
        ) : null}
        {showClearableButton ? (
          <Button
            onPress={() => state.setSelectedKey("cleared")}
            className={classNames(
              "px-2 !rounded-none -mx-[1px]",
              "group-hover:dark:!border-gray-500 group-hover:!border-gray-500",
              state.isFocused
                ? "border-gray-800 dark:border-gray-500"
                : "border-gray-200 dark:border-quinary",
              props.errorMessage &&
                "!border-red-500 focus:!border-red-700 dark:!focus:border-red-700",
            )}
            type="button"
          >
            <X className="w-5 h-5 fill-white" />
          </Button>
        ) : null}
        {includeMenu ? (
          <Button
            disabled={inputProps.disabled}
            ref={buttonRef}
            onPress={() => state.open()}
            size="xs"
            type="button"
            className={classNames(
              "rounded-l-none border-gray-200 dark:border-quinary",
              "group-hover:dark:!border-gray-500 group-hover:!border-gray-500",
              showClearableButton ? "-ml-[1px]" : "-ml-[1.5px]",
              state.isFocused && "border-gray-800 dark:border-gray-500",
              props.errorMessage &&
                "!border-red-500 focus:!border-red-700 dark:!focus:border-red-700",
            )}
          >
            <ChevronDown />
          </Button>
        ) : null}
        {includeMenu && state.isOpen ? (
          <Popover
            menuClassName={props.menuClassName}
            isOpen={state.isOpen}
            onClose={state.close}
            popoverRef={popoverRef}
          >
            {state.collection.size > 0 ? (
              <AsyncListFieldListBox {...listBoxProps} listBoxRef={listBoxRef} state={state} />
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

      {props.errorMessage && (
        <ErrorMessage errorMessage={props.errorMessage} errorMessageProps={errorMessageProps} />
      )}
    </div>
  );
}

export { Item, AsyncListSearchField };
