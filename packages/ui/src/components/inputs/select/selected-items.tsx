import { useTranslations } from "next-intl";
import { X } from "react-bootstrap-icons";
import { Button } from "../../button/button";
import type { SelectValue } from "../../fields/select-field";
import type { MultiSelectState } from "../../../hooks/select/useMultiSelectState";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "../../hover-card";

interface Props<T extends SelectValue> {
  state: MultiSelectState<T>;
  selectionMode: "single" | "multiple";
  options: T[];
}

export function SelectedItems<T extends SelectValue>(props: Props<T>) {
  const common = useTranslations("Common");

  const selectedItems = props.selectionMode === "multiple" ? props.state.selectedItems : null;
  const selectedItem = props.selectionMode === "single" ? props.state.selectedItems?.[0] : null;

  if (selectedItems && selectedItems.length > 0) {
    return (
      <>
        {selectedItems.map((item) => {
          const option = props.options.find((v) => v.value === item.key);

          return (
            <span
              className="text-sm flex items-center justify-between px-1.5 rounded-sm bg-gray-300 dark:bg-tertiary"
              key={item.key}
            >
              <HoverCard open={option?.description ? undefined : false}>
                <HoverCardTrigger asChild>
                  <span className="pr-1">{item.textValue}</span>
                </HoverCardTrigger>

                <HoverCardContent sideOffset={7} side="bottom" align="center" pointerEvents>
                  {option?.description}
                </HoverCardContent>
              </HoverCard>

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
          );
        })}
      </>
    );
  }

  if (selectedItem) {
    return (
      <span className="w-full inline-block overflow-hidden whitespace-nowrap text-ellipsis">
        {selectedItem.textValue}
      </span>
    );
  }

  return <span>{common("select")}</span>;
}
