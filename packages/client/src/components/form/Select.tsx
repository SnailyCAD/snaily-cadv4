import * as React from "react";
import { useTranslations } from "use-intl";
import ReactSelect, {
  Props as SelectProps,
  GroupBase,
  StylesConfig,
  components,
  MultiValueGenericProps,
} from "react-select";
import { useAuth } from "context/AuthContext";
import { ContextMenu } from "components/context-menu/ContextMenu";
import { useValues } from "context/ValuesContext";
import useFetch from "lib/useFetch";
import { CombinedLeoUnit, StatusValue } from "types/prisma";
import { useGenerateCallsign } from "hooks/useGenerateCallsign";
import { Full911Call, FullDeputy, useDispatchState } from "state/dispatchState";
import { makeUnitName } from "lib/utils";
import { useModal } from "context/ModalContext";
import { ModalIds } from "types/ModalIds";

export interface SelectValue<Value extends string | number = string> {
  label: string;
  value: Value;
}

interface Props extends Exclude<SelectProps, "options"> {
  onChange: (event: any) => void;
  value: SelectValue | SelectValue[] | string | null;
  values: SelectValue[];
  errorMessage?: string;
  isClearable?: boolean;
  disabled?: boolean;
  showContextMenuForUnits?: boolean;
}

function MultiValueContainer(props: MultiValueGenericProps<any>) {
  const { codes10 } = useValues();
  const { execute } = useFetch();
  const { getPayload } = useModal();
  const generateCallsign = useGenerateCallsign();
  const call = getPayload<Full911Call>(ModalIds.Manage911Call);
  const { activeDeputies, activeOfficers } = useDispatchState();

  const unitId = props.data.value;
  const unit = [...activeDeputies, ...activeOfficers].find((v) => v.id === unitId) as
    | FullDeputy
    | CombinedLeoUnit;

  async function setCode(status: StatusValue) {
    if (!unit) return;

    if (status.type === "STATUS_CODE") {
      await execute(`/dispatch/status/${unitId}`, {
        method: "PUT",
        data: { status: status.id },
      });
    } else {
      if (!call) return;
      await execute(`/911-calls/events/${call.id}`, {
        method: "POST",
        data: {
          description:
            "officers" in unit
              ? `${unit.callsign} / ${status.value.value}`
              : `${generateCallsign(unit)} ${makeUnitName(unit)} / ${status.value.value}`,
        },
      });
    }
  }

  const codesMapped: any[] = codes10.values.map((v) => ({
    name: v.value.value,
    onClick: () => setCode(v),
    "aria-label":
      v.type === "STATUS_CODE"
        ? `Set status to ${v.value.value}`
        : `Add code to event: ${v.value.value} `,
    title:
      v.type === "STATUS_CODE"
        ? `Set status to ${v.value.value}`
        : `Add code to event: ${v.value.value} `,
  }));

  if (unit) {
    codesMapped.unshift({
      name: !("officers" in unit)
        ? `${generateCallsign(unit)} ${makeUnitName(unit)}`
        : unit.callsign,
      component: "Label",
    });
  }

  return (
    <ContextMenu items={codesMapped}>
      <components.MultiValueContainer {...props} />
    </ContextMenu>
  );
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
    onChange?.({ target: { name, value: rest.isMulti ? value : value?.value ?? null } } as any);
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
      menuPortalTarget={(typeof document !== "undefined" && document.body) || undefined}
      components={rest.showContextMenuForUnits ? { MultiValueContainer } : undefined}
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
    multiValueRemove: (base) => ({
      ...base,
      backgroundColor: backgroundColor === "white" ? "#cccccc" : "#2f2f2f",
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
