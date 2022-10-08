import type { SelectValue } from "../../fields/select-field";
import type { MultiSelectState } from "../../hooks/select/useMultiSelectState";
import { ChevronDown, X } from "react-bootstrap-icons";
import { Button } from "../../button";

interface Props<T extends SelectValue> {
  state: MultiSelectState<T>;
  selectionMode: "single" | "multiple";
  isClearable: boolean | undefined;
}

export function SelectActions<T extends SelectValue>({
  state,
  selectionMode,
  isClearable,
}: Props<T>) {
  const selectedItems = selectionMode === "multiple" ? state.selectedItems : null;
  const selectedItem = selectionMode === "single" ? state.selectedItems?.[0] : null;

  return (
    <div className="flex items-center">
      {isClearable && (selectedItems || selectedItem) ? (
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
  );
}
