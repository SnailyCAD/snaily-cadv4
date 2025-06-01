import * as React from "react";
import { useDebounce } from "react-use";

export function useDebouncedValue<T = any>(_value: T, wait: number) {
  const [localValue, setLocalValue] = React.useState(_value);
  const [value, setValue] = React.useState(_value);

  useDebounce(
    () => {
      setValue(localValue);
    },
    wait,
    [localValue],
  );

  return {
    localValue,
    value,
    setLocalValue,
  };
}
