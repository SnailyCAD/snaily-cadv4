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
import { AnyValue, isBaseValue } from "@snailycad/utils";
import { useRouter } from "next/router";

interface ContextValue<T extends ValueType, Custom = Value<T>> {
  type: ValueType;
  values: Custom extends undefined ? Value<T>[] : Custom[];
}

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
  vehicleFlag: ContextValue<ValueType.VEHICLE_FLAG>;
  citizenFlag: ContextValue<ValueType.CITIZEN_FLAG>;
  penalCode: ContextValue<ValueType.PENAL_CODE, PenalCode>;
  penalCodeGroups: PenalCodeGroup[];
  department: ContextValue<ValueType.DEPARTMENT, DepartmentValue>;
  driverslicenseCategory: ContextValue<
    ValueType.DRIVERSLICENSE_CATEGORY,
    DriversLicenseCategoryValue
  >;
  impoundLot: ContextValue<ValueType.IMPOUND_LOT>;
  qualification: ContextValue<ValueType.QUALIFICATION, QualificationValue>;
  setValues: React.Dispatch<
    React.SetStateAction<
      {
        type: ValueType;
        values: Value<ValueType>[];
      }[]
    >
  >;
  callType: ContextValue<ValueType.IMPOUND_LOT, CallTypeValue>;
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
  const router = useRouter();
  const isAdmin = router.pathname.startsWith("/admin");
  const [values, setValues] = React.useState<ProviderProps["initialData"]["values"]>(
    Array.isArray(initialData.values) ? initialData.values : [],
  );

  function removeDisabledValues(values: { values: AnyValue[]; type: ValueType }) {
    if (isAdmin) return values;

    return {
      ...values,
      values: values.values.filter((value) => {
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        return !(isBaseValue(value) ? value?.isDisabled : value?.value?.isDisabled);
      }),
    };
  }

  const data = React.useMemo(() => {
    return Object.values(ValueType).reduce((obj, valueType) => {
      const valuesForType = values.find((v) => v.type === valueType) ?? {
        values: [],
        type: valueType,
      };

      if (valuesForType.type === "PENAL_CODE") {
        obj["penalCodeGroups"] = (valuesForType as any).groups ?? [];
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
