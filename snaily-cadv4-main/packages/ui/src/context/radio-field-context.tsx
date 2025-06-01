import * as React from "react";
import type { RadioGroupState } from "@react-stately/radio";

export const RadioContext = React.createContext<RadioGroupState | undefined>(undefined);

export function useRadioFieldContext() {
  const state = React.useContext(RadioContext);
  if (!state) {
    throw new Error("useRadioFieldContext must be used within a RadioGroupField");
  }
  return state;
}
