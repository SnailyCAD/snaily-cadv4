import { useTranslations } from "next-intl";
import { X } from "react-bootstrap-icons";
import { Button } from "../../button";
import type { SelectValue } from "../../fields/select-field";
import type { MultiSelectState } from "../../../hooks/select/useMultiSelectState";

interface Props<T extends SelectValue> {
  state: MultiSelectState<T>;
  selectionMode: "single" | "multiple";
}

export function SelectedItems<T extends SelectValue>(props: Props<T>) {
  const common = useTranslations("Common");

  const selectedItems = props.selectionMode === "multiple" ? props.state.selectedItems : null;
  const selectedItem = props.selectionMode === "single" ? props.state.selectedItems?.[0] : null;

  if (selectedItems && selectedItems.length > 0) {
    return (
      <>
        {selectedItems.map((item) => (
          <span
            className="text-sm flex items-center justify-between p-0.5 px-1.5 rounded-sm bg-gray-300 dark:bg-tertiary h-7"
            key={item.key}
          >
            <span className="pr-1">{item.textValue}</span>
            <Button
              className="!px-0.5 hover:!bg-gray-400 dark:hover:!bg-primary"
              variant="transparent"
              role="button"
              onPress={() => {
                const copied = [...props.state.selectedKeys].filter((v) => v !== item.key);
                props.state.setSelectedKeys(copied);
              }}
            >
              <X className="w-5 h-5" />
            </Button>
          </span>
        ))}
      </>
    );
  }

  if (selectedItem) {
    return <span>{selectedItem.textValue}</span>;
  }

  return <span>{common("select")}</span>;
}
