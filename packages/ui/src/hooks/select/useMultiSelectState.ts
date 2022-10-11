import * as React from "react";
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

export interface MultiSelectState<T> extends MultiSelectListState<T>, MenuTriggerState {
  isFocused: boolean;
  setIsFocused(isFocused: boolean): void;
}

export function useMultiSelectState<T extends {}>(props: MultiSelectProps<T>): MultiSelectState<T> {
  const [isFocused, setIsFocused] = React.useState(false);

  const triggerState = useMenuTriggerState(props);
  const listState = useMultiSelectListState({
    ...props,
    onSelectionChange: (keys) => {
      if (typeof props.onSelectionChange === "function") {
        if (keys === "all") {
          props.onSelectionChange([...new Set(listState.collection.getKeys()).values()]);
        }

        if (props.selectionMode === "single" && keys !== "all") {
          const first = [...keys.values()][0] ?? null;
          props.onSelectionChange(first!);
        } else {
          const array = typeof keys === "object" && [...keys.values()];
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
    isFocused,
    setIsFocused,
  };
}
