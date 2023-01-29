import type { SelectValue } from "../../fields/select-field";
import type { MultiSelectState } from "../../../hooks/select/useMultiSelectState";
import { ChevronDown, X } from "react-bootstrap-icons";
import { Button } from "../../button";
import { classNames } from "../../../utils/classNames";

interface Props<T extends SelectValue> {
  state: MultiSelectState<T>;
  selectionMode: "single" | "multiple";
  isClearable: boolean | undefined;
}

export function SelectActions<T extends SelectValue>(props: Props<T>) {
  const selectedItems = props.selectionMode === "multiple" ? props.state.selectedItems : null;
  const selectedItem = props.selectionMode === "single" ? props.state.selectedItems?.[0] : null;

  return (
    <div className="flex items-center">
      {props.isClearable && (selectedItems || selectedItem) ? (
        <>
          <Button
            variant="transparent"
            className="dark:text-gray-400 hover:!text-white !px-0"
            aria-label="Clear"
            onPress={() => {
              props.state.setSelectedKeys([]);
            }}
          >
            <X className="h-6 w-6" />
          </Button>
          <div className="w-[1px] h-4 rounded-md dark:bg-gray-500/80 mx-1" />
        </>
      ) : null}
      <span
        className={classNames(
          "cursor-pointer transition-transform origin-center",
          props.state.isOpen && "rotate-180",
        )}
        aria-hidden="true"
      >
        <ChevronDown />
      </span>
    </div>
  );
}
