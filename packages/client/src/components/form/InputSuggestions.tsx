import { Method } from "axios";
import useFetch from "lib/useFetch";
import * as React from "react";
import useOnclickOutside from "react-cool-onclickoutside";
import { Input } from "./Input";

interface Props {
  inputProps?: Omit<JSX.IntrinsicElements["input"], "ref"> & { hasError?: boolean };
  onSuggestionClick?: (suggestion: any) => void;
  Component: ({ suggestion }: { suggestion: any }) => JSX.Element;
  options: { apiPath: string; method: Method; minLength?: number; dataKey?: string };
}

export function InputSuggestions({ Component, onSuggestionClick, options, inputProps }: Props) {
  const [isOpen, setOpen] = React.useState(false);
  const [suggestions, setSuggestions] = React.useState<any[]>([]);
  const [localValue, setLocalValue] = React.useState("");
  const { execute } = useFetch();
  const ref = useOnclickOutside(() => setOpen(false));

  async function onSearch(e: React.ChangeEvent<HTMLInputElement>) {
    const target = e.target as HTMLInputElement;
    const value = target.value.trim();

    setLocalValue(value);

    if (value.length < (options.minLength ?? 3)) {
      setOpen(false);
      return;
    }

    const data: Record<string, unknown> = {};
    if (options.dataKey) {
      data[options.dataKey] = value;
    }

    const { json } = await execute(options.apiPath, {
      ...options,
      data,
    });

    if (json && Array.isArray(json)) {
      setSuggestions(json);
      setOpen(true);
    }
  }

  function handleSuggestionClick(suggestion: any) {
    onSuggestionClick?.(suggestion);
    setOpen(false);
  }

  function handleFocus() {
    if (suggestions.length > 0 && localValue.length > (options.minLength ?? 3)) {
      setOpen(true);
    }
  }

  async function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    inputProps?.onChange?.(e);
    // todo: debounce
    onSearch(e);
  }

  return (
    <div ref={ref} className="relative w-full">
      <Input {...inputProps} autoComplete="off" onFocus={handleFocus} onChange={handleChange} />

      {isOpen && suggestions.length > 0 ? (
        <div className="absolute z-50 w-full p-2 overflow-auto bg-white rounded-md shadow-md top-11 dark:bg-dark-bright max-h-60">
          <ul>
            {suggestions.map((suggestion) => (
              <li
                className="p-1.5 px-2 transition-colors rounded-md cursor-pointer hover:bg-gray-200 dark:hover:bg-dark-bg"
                key={suggestion.id}
                onClick={() => handleSuggestionClick(suggestion)}
              >
                {Component ? (
                  <Component suggestion={suggestion} />
                ) : (
                  <p>{JSON.stringify(suggestion)}</p>
                )}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
