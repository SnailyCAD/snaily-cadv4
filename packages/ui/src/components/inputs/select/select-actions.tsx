import type { SelectValue } from "../../fields/select-field";
import type { MultiSelectState } from "../../../hooks/select/useMultiSelectState";
import { ChevronDown, X } from "react-bootstrap-icons";
import { Button } from "../../button";
import { classNames } from "../../../utils/classNames";
import type { ReactNode } from "react";

interface Props<T extends SelectValue> {
  state: MultiSelectState<T>;
  selectionMode: "single" | "multiple";
  errorMessage?: string | ReactNode;
  isClearable: boolean | undefined;
}

export function SelectActions<T extends SelectValue>(props: Props<T>) {
  const selectedItems = props.selectionMode === "multiple" ? props.state.selectedItems : null;
  const selectedItem = props.selectionMode === "single" ? props.state.selectedItems?.[0] : null;

  const showClearableButton = props.isClearable && (selectedItems || selectedItem);

  return (
    <>
      {showClearableButton ? (
        <Button
          onPress={() => {
            props.state.setSelectedKeys([]);
          }}
          className={classNames(
            "px-2 !rounded-none -mx-[1px]",
            "group-hover:dark:!border-gray-500 group-hover:!border-gray-500",
            props.state.isOpen && "!border-gray-800 dark:!border-gray-500",
            props.errorMessage &&
              "!border-red-500 focus:!border-red-700 dark:!focus:border-red-700",
          )}
          type="button"
        >
          <X className="w-5 h-5 fill-white" />
        </Button>
      ) : null}

      <Button
        onPress={() => props.state.open()}
        size="xs"
        type="button"
        className={classNames(
          "rounded-l-none border-gray-200 dark:border-quinary",
          "group-hover:dark:!border-gray-500 group-hover:!border-gray-500",
          showClearableButton ? "-ml-[1px]" : "-ml-[1.5px]",
          props.state.isOpen && "!border-gray-800 dark:!border-gray-500",
          props.errorMessage && "!border-red-500 focus:!border-red-700 dark:!focus:border-red-700",
        )}
      >
        <ChevronDown />
      </Button>
    </>
  );
}
