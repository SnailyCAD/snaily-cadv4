import { type ComboBoxState } from "@react-stately/combobox";
import { Button } from "../../button/button";
import { ChevronDown, X } from "react-bootstrap-icons";
import { cn } from "mxcn";

interface AsyncListSearchFieldActionsProps<T> {
  state: ComboBoxState<T>;
  errorMessage: React.ReactNode;
  showClearableButton: boolean;
  isDisabled?: boolean;
  buttonRef: React.RefObject<HTMLButtonElement>;
}

export function AsyncListSearchFieldActions<T>(props: AsyncListSearchFieldActionsProps<T>) {
  const focusedClassName = props.state.isFocused
    ? "border-gray-800 dark:border-gray-500"
    : "border-gray-200 dark:border-quinary";
  const errorMessageClassName =
    !!props.errorMessage && "!border-red-500 focus:!border-red-700 dark:!focus:border-red-700";

  const enabledHoverClassName =
    !props.isDisabled && "group-hover:dark:!border-gray-500 group-hover:!border-gray-500";

  return (
    <>
      {props.showClearableButton ? (
        <Button
          isDisabled={props.isDisabled}
          type="button"
          onPress={() => props.state.setSelectedKey("cleared")}
          className={cn(
            "px-2 !rounded-none -mx-[1px]",
            enabledHoverClassName,
            focusedClassName,
            errorMessageClassName,
          )}
        >
          <X className="w-5 h-5 fill-white" />
        </Button>
      ) : null}

      <Button
        type="button"
        disabled={props.isDisabled}
        isDisabled={props.isDisabled}
        ref={props.buttonRef}
        onPress={() => props.state.open()}
        size="xs"
        className={cn(
          "rounded-l-none border-gray-200 dark:border-quinary",
          props.showClearableButton ? "-ml-[1px]" : "-ml-[1px]",
          enabledHoverClassName,
          focusedClassName,
          errorMessageClassName,
        )}
      >
        <ChevronDown />
      </Button>
    </>
  );
}
