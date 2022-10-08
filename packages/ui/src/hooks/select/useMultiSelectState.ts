import type * as React from "react";
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
} from "@react-types/shared";

export interface MultiSelectProps<T>
  extends CollectionBase<T>,
    AsyncLoadable,
    Omit<InputBase, "isReadOnly">,
    Validation,
    LabelableProps,
    TextInputBase,
    Omit<MultipleSelection, "onSelectionChange">,
    FocusableProps,
    OverlayTriggerProps {
  shouldFlip?: boolean;
  onSelectionChange?(keys: React.Key[] | React.Key): any;
}

export type MultiSelectState<T> = MultiSelectListState<T> & MenuTriggerState;

export function useMultiSelectState<T extends {}>(props: MultiSelectProps<T>): MultiSelectState<T> {
  const triggerState = useMenuTriggerState(props);
  const listState = useMultiSelectListState({
    ...props,
    onSelectionChange: (keys) => {
      if (typeof props.onSelectionChange === "function") {
        if (keys === "all") {
          props.onSelectionChange(Array.from(new Set(listState.collection.getKeys()).values()));
        }

        if (props.selectionMode === "single" && keys !== "all") {
          const first = Array.from(keys.values()).at(0)!;
          props.onSelectionChange(first);
        } else {
          const array = typeof keys === "object" && Array.from(keys.values());
          if (!array) {
            return;
          }

          props.onSelectionChange(array);
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
