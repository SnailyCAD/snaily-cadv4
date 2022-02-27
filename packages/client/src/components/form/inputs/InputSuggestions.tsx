import { FocusScope, useFocusManager } from "@react-aria/focus";
import type { Method } from "axios";
import { Loader } from "components/Loader";
import useFetch from "lib/useFetch";
import * as React from "react";
import useOnclickOutside from "react-cool-onclickoutside";
import { Input } from "./Input";

interface Props {
  inputProps?: Omit<JSX.IntrinsicElements["input"], "ref"> & { errorMessage?: string };
  onSuggestionClick?: (suggestion: any) => void;
  Component: ({ suggestion }: { suggestion: any }) => JSX.Element;
  options: { apiPath: string; method: Method; minLength?: number; dataKey?: string };
}

export function InputSuggestions({ Component, onSuggestionClick, options, inputProps }: Props) {
  const [isOpen, setOpen] = React.useState(false);
  const [suggestions, setSuggestions] = React.useState<any[]>([]);
  const [localValue, setLocalValue] = React.useState("");
  const { state, execute } = useFetch();

  const ref = useOnclickOutside(() => setOpen(false));
  const firstItemRef = React.useRef<HTMLButtonElement>(null);

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

  /** focus on the first element in the menu when there are results. */
  function focusOnMenu(e: React.KeyboardEvent<HTMLInputElement>) {
    if (suggestions.length <= 0 || !isOpen) return;

    if (e.key === "ArrowDown") {
      firstItemRef.current?.focus();
    }
  }

  async function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    inputProps?.onChange?.(e);
    // todo: debounce
    onSearch(e);
  }

  function handleBlur() {
    setOpen(false);
  }

  return (
    <div ref={ref} className="relative w-full">
      <Input
        {...inputProps}
        autoComplete="off"
        onKeyDown={focusOnMenu}
        onFocus={handleFocus}
        onChange={handleChange}
      />

      {state === "loading" ? (
        <span className="absolute top-1/2 right-3 -translate-y-1/2">
          <Loader />
        </span>
      ) : null}

      {isOpen && suggestions.length > 0 ? (
        <FocusScope restoreFocus={false}>
          <div className="absolute z-50 w-full p-2 overflow-auto bg-white rounded-md shadow-md top-11 dark:bg-dark-bright max-h-60">
            <ul onBlur={handleBlur} className="flex flex-col gap-y-1">
              {suggestions.map((suggestion, idx) => (
                <Suggestion
                  onSuggestionClick={handleSuggestionClick}
                  key={suggestion.id}
                  suggestion={suggestion}
                  Component={Component}
                  ref={idx === 0 ? firstItemRef : undefined}
                />
              ))}
            </ul>
          </div>
        </FocusScope>
      ) : null}
    </div>
  );
}

type SuggestionProps = Pick<Props, "Component" | "onSuggestionClick"> & {
  suggestion: any;
};

const Suggestion = React.forwardRef<HTMLButtonElement, SuggestionProps>(
  ({ suggestion, onSuggestionClick, Component }, ref) => {
    const focusManager = useFocusManager();

    function onKeyDown(e: React.KeyboardEvent<HTMLButtonElement>) {
      const key = e.key;

      switch (key) {
        case "ArrowDown": {
          focusManager.focusNext({ wrap: true });
          break;
        }
        case "ArrowUp": {
          focusManager.focusPrevious({ wrap: true });
          break;
        }
        default:
          break;
      }
    }

    return (
      <button
        ref={ref}
        onKeyDown={onKeyDown}
        className="p-1.5 px-2 transition-colors rounded-md cursor-pointer hover:bg-gray-200 focus:bg-gray-200 dark:hover:bg-dark-bg dark:focus:bg-dark-bg w-full"
        onClick={() => onSuggestionClick?.(suggestion)}
      >
        <Component suggestion={suggestion} />
      </button>
    );
  },
);
