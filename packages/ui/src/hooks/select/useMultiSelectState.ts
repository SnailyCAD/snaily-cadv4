import { MenuTriggerState, useMenuTriggerState } from "@react-stately/menu";
import { MultiSelectListState, useMultiSelectListState } from "./useMultiSelectListState";

import type { OverlayTriggerProps } from "@react-types/overlays";
import type {
  AsyncLoadable,
  CollectionBase,
  FocusableProps,
  InputBase,
  LabelableProps,
  MultipleSelection,
  TextInputBase,
  Validation,
  Selection,
} from "@react-types/shared";

export interface MultiSelectProps<T>
  extends CollectionBase<T>,
    AsyncLoadable,
    Omit<InputBase, "isReadOnly">,
    Validation,
    LabelableProps,
    TextInputBase,
    MultipleSelection,
    FocusableProps,
    OverlayTriggerProps {
  shouldFlip?: boolean;
}

export type MultiSelectState<T> = MultiSelectListState<T> & MenuTriggerState;

export function useMultiSelectState<T extends {}>(props: MultiSelectProps<T>): MultiSelectState<T> {
  const triggerState = useMenuTriggerState(props);
  const listState = useMultiSelectListState({
    ...props,
    onSelectionChange: (keys) => {
      if (typeof props.onSelectionChange === "function") {
        if (keys === "all") {
          props.onSelectionChange(new Set(listState.collection.getKeys()));
        }

        if (props.selectionMode === "single" && keys !== "all") {
          const first = Array.from(keys.values()).at(0)!;
          props.onSelectionChange(first as Selection);
        } else {
          props.onSelectionChange(keys);
        }
      }

      // multi select stays open after item selection
      if (props.selectionMode === "single") {
        triggerState.close();
      }
    },
  });

  return {
    ...listState,
    ...triggerState,
  };
}
