import * as React from "react";
import {
  type DepartmentValue,
  type DivisionValue,
  type DriversLicenseCategoryValue,
  type EmployeeValue,
  type PenalCode,
  type PenalCodeGroup,
  type StatusValue,
  type Value,
  ValueType,
  type VehicleValue,
  QualificationValue,
  CallTypeValue,
} from "@snailycad/types";
import type { GetValuesData } from "@snailycad/types/api";
import { hasValueObj, isBaseValue, isPenalCodeValue } from "@snailycad/utils";
import { useRouter } from "next/router";

interface ContextValue<Custom = Value> {
  type: ValueType;
  values: Custom extends undefined ? Value[] : Custom[];
}

interface Context {
  license: ContextValue;
  gender: ContextValue;
  ethnicity: ContextValue;
  weapon: ContextValue<VehicleValue>;
  bloodGroup: ContextValue;
  officerRank: ContextValue;
  division: ContextValue<DivisionValue>;
  businessRole: ContextValue<EmployeeValue>;
  codes10: ContextValue<StatusValue>;
  vehicle: ContextValue<VehicleValue>;
  vehicleFlag: ContextValue;
  citizenFlag: ContextValue;
  penalCode: ContextValue<PenalCode>;
  penalCodeGroups: PenalCodeGroup[];
  department: ContextValue<DepartmentValue>;
  driverslicenseCategory: ContextValue<DriversLicenseCategoryValue>;
  impoundLot: ContextValue;
  qualification: ContextValue<QualificationValue>;
  setValues: React.Dispatch<React.SetStateAction<GetValuesData>>;
  callType: ContextValue<CallTypeValue>;
}

const ValuesContext = React.createContext<Context | undefined>(undefined);

interface ProviderProps {
  children: React.ReactNode;
  initialData: { values: GetValuesData };
}

export function ValuesProvider({ initialData, children }: ProviderProps) {
  const router = useRouter();
  const isAdmin = router.pathname.startsWith("/admin");
  const [values, setValues] = React.useState<ProviderProps["initialData"]["values"]>(
    Array.isArray(initialData.values) ? initialData.values : [],
  );

  function removeDisabledValues(values: GetValuesData[number]) {
    if (isAdmin) return values;

    return {
      ...values,
      values: values.values.filter((value) => {
        if (isBaseValue(value)) return !value.isDisabled;
        if (hasValueObj(value)) return !value.value.isDisabled;
        if (isPenalCodeValue(value)) return true;
        return true;
      }),
    };
  }

  const data = React.useMemo(() => {
    return Object.values(ValueType).reduce((obj, valueType) => {
      const valuesForType = values.find((v) => v.type === valueType) ?? {
        values: [],
        type: valueType,
      };

      if (valuesForType.type === "PENAL_CODE" && valuesForType.groups) {
        obj.penalCodeGroups = valuesForType.groups;
      }

      return { ...obj, [normalizeValue(valueType)]: removeDisabledValues(valuesForType) };
    }, {} as Context);
  }, [values]); // eslint-disable-line

  const value = { ...data, setValues };

  React.useEffect(() => {
    if (Array.isArray(initialData.values)) {
      setValues(initialData.values);
    }
  }, [initialData.values]);

  return <ValuesContext.Provider value={value}>{children}</ValuesContext.Provider>;
}

export function useValues() {
  const context = React.useContext(ValuesContext);
  if (typeof context === "undefined") {
    throw new TypeError("`useValues` must be used within an `ValuesContext`");
  }

  return context;
}

// transform: PENAL_CODES -> penalCodes
// transform: DEPARTMENT  -> department
export function normalizeValue(value: ValueType | (string & {})) {
  let split = value.toLowerCase().split(/_/);

  if (split.length > 1) {
    split = split.map((valueType, idx) => {
      if (idx > 0) {
        const firstLetter = valueType.charAt(0);

        return [firstLetter.toUpperCase(), valueType.substring(1).toLowerCase()].join("");
      }

      return valueType.toLowerCase();
    });
  }

  return split.join("");
}
