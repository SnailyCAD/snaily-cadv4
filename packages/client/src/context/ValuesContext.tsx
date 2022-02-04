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
} from "@snailycad/types";

type ContextValue<T extends ValueType, Custom = Value<T>> = {
  type: ValueType;
  values: Custom extends undefined ? Value<T>[] : Custom[];
};

interface Context {
  license: ContextValue<ValueType.LICENSE>;
  gender: ContextValue<ValueType.GENDER>;
  ethnicity: ContextValue<ValueType.ETHNICITY>;
  weapon: ContextValue<ValueType.WEAPON, VehicleValue>;
  bloodGroup: ContextValue<ValueType.BLOOD_GROUP>;
  officerRank: ContextValue<ValueType.OFFICER_RANK>;
  division: ContextValue<ValueType.DIVISION, DivisionValue>;
  businessRole: ContextValue<ValueType.BUSINESS_ROLE, EmployeeValue>;
  codes10: ContextValue<ValueType.CODES_10, StatusValue>;
  vehicle: ContextValue<ValueType.VEHICLE, VehicleValue>;
  penalCode: ContextValue<ValueType.PENAL_CODE, PenalCode>;
  penalCodeGroups: PenalCodeGroup[];
  department: ContextValue<ValueType.DEPARTMENT, DepartmentValue>;
  driverslicenseCategory: ContextValue<
    ValueType.DRIVERSLICENSE_CATEGORY,
    DriversLicenseCategoryValue
  >;
  impoundLot: ContextValue<ValueType.IMPOUND_LOT>;
}

const ValuesContext = React.createContext<Context | undefined>(undefined);

interface ProviderProps {
  children: React.ReactChild | React.ReactChild[];
  initialData: {
    values: {
      type: ValueType;
      values: Value<ValueType>[];
    }[];
  };
}

export function ValuesProvider({ initialData, children }: ProviderProps) {
  const [values, setValues] = React.useState<ProviderProps["initialData"]["values"]>(
    Array.isArray(initialData.values) ? initialData.values : [],
  );

  const data = React.useMemo(() => {
    return Object.values(ValueType).reduce((obj, valueType) => {
      const v = values.find((v) => v.type === valueType) ?? { values: [], type: valueType };

      if (v.type === "PENAL_CODE") {
        obj["penalCodeGroups"] = (v as any)?.groups ?? [];
      }

      return { ...obj, [normalizeValue(valueType)]: v };
    }, {} as Context);
  }, [values]);

  const value = data;

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
    throw new Error("`useValues` must be used within an `ValuesContext`");
  }

  return context;
}

// transform: PENAL_CODES -> penalCodes
// transform: DEPARTMENT  -> department
export function normalizeValue(value: ValueType | (string & {})) {
  let split = value.toLowerCase().split(/_/);

  if (split.length > 1) {
    split = split.map((v, idx) => {
      if (idx > 0) {
        return [v[0]!.toUpperCase(), v.substr(1).toLowerCase()].join("");
      }

      return v.toLowerCase();
    });
  }

  return split.join("");
}
