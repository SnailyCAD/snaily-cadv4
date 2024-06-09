import type { SelectValue } from "../../fields/select-field";
import type { MultiSelectState } from "../../../hooks/select/useMultiSelectState";
import { ChevronDown, X } from "react-bootstrap-icons";
import { Button } from "../../button/button";
import { cn } from "mxcn";
import type { ReactNode } from "react";
import { Loader } from "../../loader";

interface Props<T extends SelectValue> {
  state: MultiSelectState<T>;
  selectionMode: "single" | "multiple";
  errorMessage?: string | ReactNode;
  isClearable?: boolean;
  isDisabled?: boolean;
  isLoading?: boolean;
}

export function SelectActions<T extends SelectValue>(props: Props<T>) {
  const selectedItems = props.selectionMode === "multiple" ? props.state.selectedItems : null;
  const selectedItem = props.selectionMode === "single" ? props.state.selectedItems?.[0] : null;

  const showClearableButton = props.isClearable && (selectedItems || selectedItem);

  return (
    <>
      {props.isLoading ? (
        <div
          className={cn(
            "absolute top-0 bottom-0 flex items-center justify-center",
            showClearableButton ? "right-[82px]" : "right-12",
          )}
        >
          <Loader />
        </div>
      ) : null}

      {showClearableButton ? (
        <Button
          isDisabled={props.isDisabled}
          onPress={() => {
            props.state.setSelectedKeys([]);
          }}
          className={cn(
            "px-2 !rounded-none -mx-[1.5px]",
            "group-hover:dark:!border-gray-500 group-hover:!border-gray-500",
            props.state.isOpen && "!border-gray-800 dark:!border-gray-500",
            !!props.errorMessage &&
              "!border-red-500 focus:!border-red-700 dark:!focus:border-red-700",
          )}
          type="button"
        >
          <X className="w-5 h-5 dark:fill-white" />
        </Button>
      ) : null}

      <Button
        isDisabled={props.isDisabled}
        onPress={() => props.state.open()}
        size="xs"
        type="button"
        className={cn(
          "rounded-l-none",
          !showClearableButton && "-ml-[1.5px]",
          "group-hover:dark:!border-gray-500 group-hover:!border-gray-500",
          props.state.isOpen && "!border-gray-800 dark:!border-gray-500",
          !!props.errorMessage &&
            "!border-red-500 focus:!border-red-700 dark:!focus:border-red-700",
        )}
      >
        <ChevronDown className="w-5 h-5 dark:fill-white" />
      </Button>
    </>
  );
}
