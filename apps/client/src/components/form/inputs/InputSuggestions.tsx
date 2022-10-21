import { FocusScope, useFocusManager } from "@react-aria/focus";
import type { Method } from "axios";
import { useFocusWithin } from "@react-aria/interactions";
import { Input, Loader } from "@snailycad/ui";
import useFetch from "lib/useFetch";
import * as React from "react";
import useonPressOutside from "react-cool-onclickoutside";
import { useTranslations } from "next-intl";
import { useDebounce } from "react-use";
import { isMobile } from "is-mobile";

type ApiPathFunc = (inputValue: string) => string;
type Suggestion = { id: string } & Record<string, unknown>;
const MIN_LENGTH = 2 as const;

interface Props<Suggestion extends { id: string }> {
  inputProps?: Omit<JSX.IntrinsicElements["input"], "ref"> & { errorMessage?: string };
  onSuggestionPress?(suggestion: Suggestion): void;
  Component({ suggestion }: { suggestion: Suggestion }): JSX.Element;
  options: {
    apiPath: string | ApiPathFunc;
    method: Method;
    dataKey?: string;
    allowUnknown?: boolean;
  };
}

export function InputSuggestions<Suggestion extends { id: string }>({
  Component,
  onSuggestionPress,
  options,
  inputProps,
}: Props<Suggestion>) {
  const [isOpen, setOpen] = React.useState(false);
  const [suggestions, setSuggestions] = React.useState<Suggestion[]>([]);

  const [localValue, setLocalValue] = React.useState("");
  useDebounce(async () => onSearch(localValue), 150, [localValue]);

  const common = useTranslations("Common");

  const { state, execute } = useFetch();
  const { focusWithinProps } = useFocusWithin({
    isDisabled: isMobile({ tablet: true }),
    onBlurWithin: () => setOpen(false),
  });

  const ref = useonPressOutside(() => setOpen(false));
  const firstItemRef = React.useRef<HTMLButtonElement>(null);

  async function onSearch(value: string) {
    setLocalValue(value);

    if (value.trim().length < MIN_LENGTH) {
      setOpen(false);
      return;
    }

    const data: Record<string, unknown> = {};
    if (options.dataKey) {
      data[options.dataKey] = value;
    }

    const apiPath =
      typeof options.apiPath === "function" ? options.apiPath(value) : options.apiPath;

    const { json } = await execute({
      path: apiPath,
      ...options,
      noToast: true,
      data,
    });

    if (json && Array.isArray(json)) {
      setSuggestions(json);
      setOpen(true);
    }
  }

  function handleSuggestionPress(suggestion: Suggestion) {
    onSuggestionPress?.(suggestion);
    setOpen(false);
  }

  function handleFocus() {
    if (suggestions.length > 0 && localValue.length > MIN_LENGTH) {
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

  function handleBlur(e: React.FocusEvent<HTMLInputElement>) {
    if (suggestions.length >= 1 || options.allowUnknown) return;

    inputProps?.onChange?.({ ...e, target: { ...e.target, name: e.target.name, value: "" } });
    setLocalValue("");
    e.target.value = "";
  }

  async function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    inputProps?.onChange?.(e);
    setLocalValue(e.target.value);
  }

  return (
    <div {...focusWithinProps} ref={ref} className="relative w-full">
      <Input
        {...inputProps}
        autoComplete="off"
        onKeyDown={focusOnMenu}
        onFocus={handleFocus}
        onChange={handleChange}
        onBlur={handleBlur}
      />

      {state === "loading" ? (
        <span className="absolute top-1/2 right-3 -translate-y-1/2">
          <Loader />
        </span>
      ) : null}

      {isOpen ? (
        <FocusScope restoreFocus={false}>
          <div className="absolute z-50 w-full p-2 overflow-auto bg-white rounded-md shadow-md top-11 dark:bg-secondary max-h-60">
            <ul className="flex flex-col gap-y-1">
              {suggestions.length <= 0 ? (
                <span className="text-neutral-600 dark:text-gray-500">{common("noOptions")}</span>
              ) : null}

              {suggestions.map((suggestion, idx) => (
                <Suggestion
                  onSuggestionPress={handleSuggestionPress}
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

type SuggestionProps<Suggestion extends { id: string }> = Pick<
  Props<Suggestion>,
  "Component" | "onSuggestionPress"
> & {
  suggestion: Suggestion;
};

const Suggestion = React.forwardRef<HTMLButtonElement, SuggestionProps<Suggestion>>(
  ({ suggestion, onSuggestionPress, Component }, ref) => {
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
        data-suggestion
        ref={ref}
        onKeyDown={onKeyDown}
        className="p-1.5 px-2 transition-colors rounded-md cursor-pointer hover:bg-gray-200 focus:bg-gray-200 dark:hover:bg-tertiary dark:focus:bg-tertiary w-full"
        onClick={() => onSuggestionPress?.(suggestion)}
        type="button"
      >
        <Component suggestion={suggestion} />
      </button>
    );
  },
);
