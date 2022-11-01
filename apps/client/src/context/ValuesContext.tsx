import * as React from "react";
import type {
  DepartmentValue,
  DivisionValue,
  DriversLicenseCategoryValue,
  EmployeeValue,
  PenalCode,
  PenalCodeGroup,
  StatusValue,
  Value,
  VehicleValue,
  QualificationValue,
  CallTypeValue,
  AddressValue,
} from "@snailycad/types";
import { ValueType } from "@snailycad/types";
import type { GetValuesData } from "@snailycad/types/api";
import { hasValueObj, isBaseValue, isPenalCodeValue } from "@snailycad/utils";
import type { Router } from "next/router";

interface ContextValue<Custom = Value> {
  type: ValueType;
  values: Custom extends undefined ? Value[] : Custom[];
}

export interface ValueContext {
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
  callType: ContextValue<CallTypeValue>;
  address: ContextValue<AddressValue>;
  setValues: React.Dispatch<React.SetStateAction<GetValuesData>>;
}

const ValuesContext = React.createContext<ValueContext | undefined>(undefined);

interface ProviderProps {
  router: Router;
  children: React.ReactNode;
  initialData: { values: GetValuesData };
}

export function ValuesProvider({ initialData, children, router }: ProviderProps) {
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
    }, {} as ValueContext);
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
