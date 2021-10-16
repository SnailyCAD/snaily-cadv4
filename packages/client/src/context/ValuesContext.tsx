import * as React from "react";
import { EmployeeValue, StatusValue, Value, valueType, ValueType } from "types/prisma";

type ContextValue<T extends ValueType> = {
  type: ValueType;
  values: Value<T>[];
};

interface Context {
  license: ContextValue<"LICENSE">;
  gender: ContextValue<"GENDER">;
  ethnicity: ContextValue<"ETHNICITY">;
  vehicle: ContextValue<"VEHICLE">;
  weapon: ContextValue<"WEAPON">;
  bloodGroup: ContextValue<"BLOOD_GROUP">;
  penalCode: ContextValue<"PENAL_CODE">;
  department: ContextValue<"DEPARTMENT">;
  officerRank: ContextValue<"OFFICER_RANK">;
  businessRole: {
    type: ValueType;
    values: EmployeeValue[];
  };
  codes10: {
    type: ValueType;
    values: StatusValue[];
  };
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

export const ValuesProvider = ({ initialData, children }: ProviderProps) => {
  const [values, setValues] = React.useState<ProviderProps["initialData"]["values"]>(
    Array.isArray(initialData.values) ? initialData.values : [],
  );

  const data = React.useMemo(() => {
    return Object.values(valueType).reduce((obj, value) => {
      const v = values.find((v) => v.type === value) ?? { values: [], type: value };
      return { ...obj, [normalizeValue(value)]: v };
    }, {} as Context);
  }, [values]);

  const value = data;

  React.useEffect(() => {
    if (Array.isArray(initialData.values)) {
      setValues(initialData.values);
    }
  }, [initialData.values]);

  return <ValuesContext.Provider value={value}>{children}</ValuesContext.Provider>;
};

export function useValues() {
  const context = React.useContext(ValuesContext);
  if (typeof context === "undefined") {
    throw new Error("`useValues` must be used within an `ValuesContext`");
  }

  return context;
}

// transform: PENAL_CODES -> penalCodes
// transform: DEPARTMENT  -> department
function normalizeValue(value: ValueType) {
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
