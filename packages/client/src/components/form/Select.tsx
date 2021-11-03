import * as React from "react";
import { useTranslations } from "use-intl";
import ReactSelect, { Props as SelectProps, GroupBase, StylesConfig } from "react-select";
import { useAuth } from "context/AuthContext";

export interface SelectValue<Value extends string | number = string> {
  label: string;
  value: Value;
}

interface Props extends Exclude<SelectProps, "options"> {
  onChange: (event: any) => void;
  value: SelectValue | SelectValue[] | string | null;
  values: SelectValue[];
  hasError?: boolean;
  isClearable?: boolean;
  disabled?: boolean;
}

export const Select = ({ name, onChange, ...rest }: Props) => {
  const { user } = useAuth();
  const common = useTranslations("Common");
  const value =
    typeof rest.value === "string" ? rest.values.find((v) => v.value === rest.value) : rest.value;

  const useDarkTheme =
    user?.isDarkTheme &&
    typeof window !== "undefined" &&
    window.document.body.classList.contains("dark");

  const theme = useDarkTheme ? { backgroundColor: "rgb(39, 40, 43)", color: "white" } : {};

  function handleChange(value: SelectValue | null) {
    onChange?.({ target: { name, value: rest.isMulti ? value : value?.value ?? null } } as any);
  }

  return (
    <ReactSelect
      {...rest}
      isDisabled={rest.disabled ?? false}
      value={value}
      options={rest.values}
      onChange={(v: any) => handleChange(v)}
      noOptionsMessage={() => common("noOptions")}
      styles={styles(theme)}
      className="border-gray-500"
      menuPortalTarget={(typeof document !== "undefined" && document.body) || undefined}
    />
  );
};

export interface SelectTheme {
  backgroundColor?: string;
  color?: string;
}

export const styles = ({
  backgroundColor = "rgb(229, 231, 235)",
  color = "var(--dark)",
}: SelectTheme): StylesConfig<unknown, boolean, GroupBase<unknown>> => ({
  valueContainer: (base) => ({
    ...base,
    background: backgroundColor,
    color,
    ":hover": {
      border: "none",
    },
  }),
  option: (base) => ({
    ...base,
    padding: "0.5em",
    width: "100%",
    backgroundColor,
    color,
    cursor: "pointer",
    transition: "filter 200ms",
    borderRadius: "0.2rem",
    marginTop: "0.2rem",
    ":hover": {
      filter: "brightness(80%)",
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
    borderColor: "rgba(229, 231, 235, 0.5)",
  }),
  noOptionsMessage: (base) => ({
    ...base,
    color,
  }),
  multiValueLabel: (base) => ({
    ...base,
    backgroundColor: "#cccccc",
    color,
    padding: "0.2rem",
    borderRadius: "2px 0 0 2px",
  }),
  multiValueRemove: (base) => ({
    ...base,
    backgroundColor: "#cccccc",
    color,
    borderRadius: "0 2px 2px 0",
    cursor: "pointer",
    ":hover": {
      filter: "brightness(90%)",
    },
  }),
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
      color: "#222",
    },
  }),
  dropdownIndicator: (base) => ({
    ...base,
    cursor: "pointer",
    color,
    ":hover": {
      color: "#222",
    },
  }),
  control: (base, state) => ({
    ...base,
    background: backgroundColor,
    borderRadius: "0.375rem",
    overflow: "hidden",
    border: state.isFocused ? "1.5px solid rgb(107, 114, 128)" : `1.5px solid ${backgroundColor}`,
    boxShadow: "none",
    ":hover": {
      boxShadow: "none",
      borderColor: "rgb(107, 114, 128)",
    },
    ":focus": {
      borderColor: "rgb(107, 114, 128)",
      boxShadow: "none",
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
});
