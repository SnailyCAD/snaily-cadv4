import { useTranslations } from "use-intl";
import ReactSelect, { Props as SelectProps, GroupBase, StylesConfig } from "react-select";
import { useAuth } from "context/AuthContext";
import { useModal } from "context/ModalContext";
import { MultiValueContainerContextMenu } from "./select/MultiValueContainerContextMenu";
import { MultiValueContainerPenalCode } from "./select/MultiValueContainerPenalCode";

export interface SelectValue<Value = string> {
  readonly label: string;
  readonly value: Value;
  readonly isDisabled?: boolean;
}

interface Props<Value extends SelectValue = SelectValue<any>>
  extends Exclude<SelectProps, "options"> {
  onChange: (event: any) => void;
  value: Value | Value[] | string | null;
  values: Value[];
  errorMessage?: string;
  isClearable?: boolean;
  disabled?: boolean;
  extra?: {
    showContextMenuForUnits?: boolean;
    showPenalCodeDescriptions?: boolean;
  };
}

export function Select({ name, onChange, ...rest }: Props) {
  const { user } = useAuth();
  const common = useTranslations("Common");
  const value =
    typeof rest.value === "string" ? rest.values.find((v) => v.value === rest.value) : rest.value;
  const { canBeClosed } = useModal();

  const useDarkTheme =
    user?.isDarkTheme &&
    typeof window !== "undefined" &&
    window.document.body.classList.contains("dark");

  const theme = useDarkTheme ? { backgroundColor: "rgb(39, 40, 43)", color: "white" } : {};

  function handleChange(value: SelectValue | null) {
    onChange({ target: { name, value: rest.isMulti ? value : value?.value ?? null } } as any);
  }

  return (
    <ReactSelect
      {...rest}
      isDisabled={rest.disabled ?? !canBeClosed}
      value={value}
      options={rest.values}
      onChange={(v: any) => handleChange(v)}
      noOptionsMessage={() => common("noOptions")}
      styles={styles({ ...theme, hasError: !!rest.errorMessage })}
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      menuPortalTarget={(typeof document !== "undefined" && document.body) || undefined}
      components={
        rest.extra?.showContextMenuForUnits
          ? { MultiValueContainer: MultiValueContainerContextMenu }
          : rest.extra?.showPenalCodeDescriptions
          ? { MultiValueContainer: MultiValueContainerPenalCode }
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
      transition: "filter 200ms",
      borderRadius: "0.2rem",
      marginTop: "0.2rem",
      opacity: option.isDisabled ? 0.8 : 1,
      ":hover": {
        filter: option.isDisabled ? "none" : "brightness(80%)",
      },
    }),
    menu: (prov) => ({
      ...prov,
      width: "100%",
      color,
      padding: "0.3rem",
      backgroundColor,
      boxShadow: "0 8px 16px rgba(0, 0, 0, 0.5)",
    }),
    multiValue: (base) => ({
      ...base,
      color: "#000",
      borderColor: backgroundColor === "white" ? "#cccccc" : "#2f2f2f",
      backgroundColor: backgroundColor === "white" ? "#cccccc" : "#2f2f2f",
    }),
    noOptionsMessage: (base) => ({
      ...base,
      color,
    }),
    multiValueLabel: (base) => ({
      ...base,
      backgroundColor: backgroundColor === "white" ? "#cccccc" : "#2f2f2f",
      color,
      padding: "0.2rem",
      borderRadius: "2px 0 0 2px",
    }),
    multiValueRemove: (base, props) => {
      if (props.isDisabled) {
        return { ...base, display: "none" };
      }

      return {
        ...base,
        backgroundColor: backgroundColor === "white" ? "#cccccc" : "#2f2f2f",
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
  };
}
