import * as React from "react";
import {
  DepartmentValue,
  DivisionValue,
  DriversLicenseCategoryValue,
  EmployeeValue,
  PenalCode,
  PenalCodeGroup,
  StatusValue,
  Value,
  valueType,
  ValueType,
  VehicleValue,
} from "@snailycad/types";

type ContextValue<T extends ValueType, Custom = Value<T>> = {
  type: ValueType;
  values: Custom extends undefined ? Value<T>[] : Custom[];
};

interface Context {
  license: ContextValue<"LICENSE">;
  gender: ContextValue<"GENDER">;
  ethnicity: ContextValue<"ETHNICITY">;
  weapon: ContextValue<"WEAPON", VehicleValue>;
  bloodGroup: ContextValue<"BLOOD_GROUP">;
  officerRank: ContextValue<"OFFICER_RANK">;
  division: ContextValue<"DIVISION", DivisionValue>;
  businessRole: ContextValue<"BUSINESS_ROLE", EmployeeValue>;
  codes10: ContextValue<"CODES_10", StatusValue>;
  vehicle: ContextValue<"VEHICLE", VehicleValue>;
  penalCode: ContextValue<"PENAL_CODE", PenalCode>;
  penalCodeGroups: PenalCodeGroup[];
  department: ContextValue<"DEPARTMENT", DepartmentValue>;
  driverslicenseCategory: ContextValue<"DRIVERSLICENSE_CATEGORY", DriversLicenseCategoryValue>;
  impoundLot: ContextValue<"IMPOUND_LOT">;
}

const ValuesContext = React.createContext<Context | undefined>(undefined);

interface ProviderProps {
  children: React.ReactChild | React.ReactChild[];
  initialData: {
    values: {
      type: ValueType;
      values: Value[];
    }[];
  };
}

export function ValuesProvider({ initialData, children }: ProviderProps) {
  const [values, setValues] = React.useState<ProviderProps["initialData"]["values"]>(
    Array.isArray(initialData.values) ? initialData.values : [],
  );

  const data = React.useMemo(() => {
    return Object.values(valueType).reduce((obj, valueType) => {
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
