import * as React from "react";
import { Value, ValueType } from "types/prisma";

type Context = {
  genders: {
    type: ValueType;
    values: Value[];
  };
  ethnicities: {
    type: ValueType;
    values: Value[];
  };
  licenses: {
    type: ValueType;
    values: Value[];
  };
  vehicles: {
    type: ValueType;
    values: Value[];
  };
  weapons: {
    type: ValueType;
    values: Value[];
  };
  bloodGroups: {
    type: ValueType;
    values: Value[];
  };
};

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

  const genders = values.find((v) => v.type === "GENDER");
  const ethnicities = values.find((v) => v.type === "ETHNICITY");
  const licenses = values.find((v) => v.type === "LICENSE");
  const vehicles = values.find((v) => v.type === "VEHICLE");
  const weapons = values.find((v) => v.type === "WEAPON");
  const bloodGroups = values.find((v) => v.type === "BLOOD_GROUP");

  const value = {
    genders: genders ?? [],
    ethnicities: ethnicities ?? [],
    licenses: licenses ?? [],
    vehicles: vehicles ?? [],
    weapons: weapons ?? [],
    bloodGroups: bloodGroups ?? [],
  } as Context;

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
