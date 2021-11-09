import { Method } from "axios";
import useFetch from "lib/useFetch";
import * as React from "react";
import { Input } from "./Input";

interface Props {
  inputProps?: JSX.IntrinsicElements["input"] & { hasError?: boolean };
  onSuggestionClick?: (suggestion: any) => void;
  Component: ({ suggestion }: { suggestion: any }) => JSX.Element;
  options: { apiPath: string; method: Method; data: any };
}

export const InputSuggestions = ({ Component, onSuggestionClick, options, inputProps }: Props) => {
  const [suggestions, setSuggestions] = React.useState<any[]>([]);
  const { execute } = useFetch();

  async function onSearch(e: React.ChangeEvent<HTMLInputElement>) {
    const target = e.target as HTMLInputElement;
    const value = target.value;

    if (value.length < 3) return;

    const { json } = await execute(options.apiPath, {
      ...options,
    });

    if (json && Array.isArray(json)) {
      setSuggestions(json);
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    onSearch(e);
    inputProps?.onChange?.(e);
  }

  return (
    <div className="relative w-full">
      <Input {...(inputProps as any)} onChange={handleChange} />

      {suggestions.length > 0 ? (
        <div className="absolute w-full p-2 bg-white rounded-md shadow-md top-11 dark:bg-dark-bright max-h-72">
          <ul>
            {suggestions.map((suggestion) => (
              <li
                className="p-1.5 px-2 transition-colors rounded-md cursor-pointer hover:bg-gray-200 dark:hover:bg-dark-bg"
                key={suggestion.id}
                onClick={() => onSuggestionClick?.(suggestion)}
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
};
