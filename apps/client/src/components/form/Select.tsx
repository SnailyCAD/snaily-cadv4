import { useTranslations } from "use-intl";
import ReactSelect, {
  Props as SelectProps,
  GroupBase,
  StylesConfig,
  ActionMeta,
} from "react-select";
import { useAuth } from "context/AuthContext";
import { useModal } from "state/modalState";

import { MultiValueContainerContextMenu } from "./select/MultiValueContainerContextMenu";
import { MultiValueContainerPenalCode } from "./select/MultiValueContainerPenalCode";
import { MultiValueContainerDescription } from "./select/MultiValueContainerDescription";

export interface SelectValue<Value = string> {
  readonly label: string;
  readonly value: Value;
  readonly isDisabled?: boolean;
  readonly isFixed?: boolean;
  readonly description?: string | null;
}

interface Props<Value extends SelectValue = SelectValue<any>>
  extends Exclude<SelectProps, "options"> {
  onChange(event: any): void;
  value: Value | Value[] | string | null;
  values: Value[];
  errorMessage?: string;
  isClearable?: boolean;
  disabled?: boolean;
  extra?: {
    showContextMenuForUnits?: boolean;
    showPenalCodeDescriptions?: boolean;
    showDLCategoryDescriptions?: boolean;
  };
}

export function Select({ name, onChange, ...rest }: Props) {
  const { user } = useAuth();
  const common = useTranslations("Common");
  const { canBeClosed } = useModal();

  const value =
    typeof rest.value === "string" ? rest.values.find((v) => v.value === rest.value) : rest.value;

  const useDarkTheme =
    user?.isDarkTheme &&
    typeof window !== "undefined" &&
    window.document.body.classList.contains("dark");

  const theme = useDarkTheme ? { backgroundColor: "rgb(53, 52, 60)", color: "white" } : {};
  const fixedClearable =
    Array.isArray(value) && value.some((v) => typeof v.isFixed !== "undefined");

  function handleChange(changedValue: SelectValue | null, actionMeta: ActionMeta<any>) {
    const fixedOptions = Array.isArray(value) ? value.filter((v) => v.isFixed) : [];

    if (["pop-value", "remove-value"].includes(actionMeta.action) && changedValue?.isFixed) {
      return;
    }

    if (actionMeta.action === "clear" && Array.isArray(value)) {
      onChange({
        target: { name, value: rest.isMulti ? fixedOptions : changedValue?.value ?? null },
      });
      return;
    }

    onChange({
      target: { name, value: rest.isMulti ? changedValue : changedValue?.value ?? null },
    });
  }

  return (
    <ReactSelect
      {...rest}
      isDisabled={rest.disabled ?? !canBeClosed}
      isClearable={fixedClearable ? value.some((v) => !v.isFixed) : rest.isClearable}
      value={value}
      options={rest.values}
      onChange={(v: any, meta) => handleChange(v, meta)}
      noOptionsMessage={() => common("noOptions")}
      styles={styles({ ...theme, hasError: !!rest.errorMessage })}
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      menuPortalTarget={(typeof document !== "undefined" && document.body) || undefined}
      components={
        rest.extra?.showContextMenuForUnits
          ? { MultiValueContainer: MultiValueContainerContextMenu }
          : rest.extra?.showPenalCodeDescriptions
          ? { MultiValueContainer: MultiValueContainerPenalCode }
          : rest.extra?.showDLCategoryDescriptions
          ? { MultiValueContainer: MultiValueContainerDescription }
          : undefined
      }
    />
  );
}

export interface SelectStylesOptions {
  backgroundColor?: string;
  color?: string;
  hasError?: boolean;
}

export function styles({
  backgroundColor = "white",
  color = "var(--dark)",
  hasError = false,
}: SelectStylesOptions): StylesConfig<unknown, boolean, GroupBase<unknown>> {
  return {
    valueContainer: (base) => ({
      ...base,
      background: backgroundColor,
      color,
      ":hover": {
        border: "none",
      },
    }),
    option: (base, option) => ({
      ...base,
      padding: "0.5em",
      width: "100%",
      backgroundColor,
      color,
      cursor: option.isDisabled ? "not-allowed" : "pointer",
      transition: "background 150ms",
      borderRadius: "0.2rem",
      marginTop: "0.2rem",
      opacity: option.isDisabled ? 0.8 : 1,
      background: option.isFocused
        ? backgroundColor === "white"
          ? "#D4D4D4"
          : "#1f1e26"
        : "transparent",
      ":hover": {
        background: option.isDisabled
          ? "none"
          : backgroundColor === "white"
          ? "#D4D4D4"
          : "#1f1e26",
      },
    }),
    menu: (prov) => ({
      ...prov,
      width: "100%",
      color,
      padding: "0.5rem",
      backgroundColor,
      boxShadow: "0 8px 16px rgba(0, 0, 0, 0.5)",
    }),
    multiValue: (base) => ({
      ...base,
      color: "#000",
      borderColor: backgroundColor === "white" ? "#D4D4D4" : "#1f1e26",
      backgroundColor: backgroundColor === "white" ? "#D4D4D4" : "#1f1e26",
    }),
    noOptionsMessage: (base) => ({
      ...base,
      color,
    }),
    multiValueLabel: (base) => ({
      ...base,
      backgroundColor: backgroundColor === "white" ? "#D4D4D4" : "#1f1e26",
      color,
      padding: "0.2rem",
      borderRadius: "2px 0 0 2px",
    }),
    multiValueRemove: (base, props) => {
      if (props.isDisabled || (props.data as any).isFixed) {
        return { ...base, display: "none" };
      }

      return {
        ...base,
        backgroundColor: backgroundColor === "white" ? "#D4D4D4" : "#1f1e26",
        color,
        borderRadius: "0 2px 2px 0",
        cursor: "pointer",
        ":hover": {
          filter: "brightness(90%)",
        },
      };
    },
    indicatorsContainer: (base) => ({
      ...base,
      backgroundColor,
      color,
    }),
    clearIndicator: (base) => ({
      ...base,
      cursor: "pointer",
      color,
      ":hover": {
        color: backgroundColor === "white" ? "#222" : "#a1a1a1",
      },
    }),
    dropdownIndicator: (base) => ({
      ...base,
      cursor: "pointer",
      color,
      ":hover": {
        color: backgroundColor === "white" ? "#222" : "#a1a1a1",
      },
    }),
    control: (base, state) => ({
      ...base,
      opacity: state.isDisabled ? 0.7 : undefined,
      cursor: state.isDisabled ? "not-allowed !important" : undefined,
      background: backgroundColor,
      borderRadius: "0.375rem",
      overflow: "hidden",
      border: hasError
        ? "1.5px solid #EF4444"
        : state.isFocused
        ? "1.5px solid rgb(107, 114, 128)"
        : `1.5px solid ${backgroundColor === "white" ? "rgb(229, 231, 235)" : "rgb(75, 85, 99)"}`,
      boxShadow: "none",
      ":hover": {
        boxShadow: "none",
        borderColor: hasError ? "#EF4444" : "rgb(107, 114, 128)",
      },
      ":focus": {
        borderColor: hasError ? "#EF4444" : "rgb(107, 114, 128)",
        boxShadow: "none",
        ":hover": {
          boxShadow: "none",
          borderColor: hasError ? "#EF4444" : "rgb(107, 114, 128)",
        },
        ":focus": {
          borderColor: hasError ? "#EF4444" : "rgb(107, 114, 128)",
          boxShadow: "none",
        },
      },
    }),
    placeholder: (base) => ({
      ...base,
      color,
      opacity: "0.4",
    }),
    singleValue: (base) => ({
      ...base,
      color,
    }),
    input: (base) => ({
      ...base,
      color,
    }),
    menuPortal: (base) => ({ ...base, zIndex: 9999 }),
    container: (base, state) => ({
      ...base,
      opacity: state.isDisabled ? 0.7 : undefined,
      cursor: state.isDisabled ? "not-allowed !important" : undefined,
    }),
  };
}
