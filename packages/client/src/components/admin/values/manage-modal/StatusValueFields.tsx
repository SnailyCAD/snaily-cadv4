import { FormField } from "components/form/FormField";
import { Input } from "components/form/inputs/Input";
import { Select } from "components/form/Select";
import { useFormikContext } from "formik";
import { QualificationValue, ShouldDoType, StatusValue, Value, WhatPages } from "@snailycad/types";

import { useValues } from "context/ValuesContext";

export const SHOULD_DO_LABELS: Record<ShouldDoType, string> = {
  [ShouldDoType.SET_STATUS]: "Set Status",
  [ShouldDoType.SET_OFF_DUTY]: "Set Off duty",
  [ShouldDoType.SET_ON_DUTY]: "Set On duty",
  [ShouldDoType.SET_ASSIGNED]: "Set Assigned",
  [ShouldDoType.PANIC_BUTTON]: "Panic Button",
};

export const WHAT_PAGES_LABELS: Record<WhatPages, string> = {
  [WhatPages.LEO]: "LEO",
  [WhatPages.EMS_FD]: "EMS/FD",
  [WhatPages.DISPATCH]: "Dispatch",
};

const SHOULD_DO_VALUES = Object.values(ShouldDoType).map((v) => ({
  label: SHOULD_DO_LABELS[v],
  value: v,
}));

const WHAT_PAGES_VALUES = Object.values(WhatPages).map((v) => ({
  label: WHAT_PAGES_LABELS[v],
  value: v,
}));

export function useDefaultDepartments() {
  const { department } = useValues();

  const DEFAULT_DEPARTMENTS = department.values.map((v) => ({
    value: v.id,
    label: v.value.value,
  }));

  function makeDefaultDepartments(value: StatusValue | QualificationValue | Value | null) {
    if (!value) return [];
    const departments =
      ("officerRankDepartments" in value
        ? value.officerRankDepartments
        : "departments" in value
        ? value.departments
        : []) ?? [];

    return departments.length <= 0
      ? DEFAULT_DEPARTMENTS
      : departments.map((v) => ({
          label: v.value.value,
          value: v.id,
        }));
  }

  return makeDefaultDepartments;
}

export function StatusValueFields() {
  const { values, errors, setFieldValue, handleChange } = useFormikContext<any>();
  const { department } = useValues();

  return (
    <>
      <FormField errorMessage={errors.shouldDo as string} label="Should Do">
        <Select
          values={SHOULD_DO_VALUES}
          name="shouldDo"
          onChange={handleChange}
          value={values.shouldDo}
        />
      </FormField>

      <FormField errorMessage={errors.whatPages as string} label="What Pages">
        <Select
          values={WHAT_PAGES_VALUES}
          name="whatPages"
          onChange={handleChange}
          value={values.whatPages}
          isMulti
          closeMenuOnSelect={false}
        />
      </FormField>

      {values.shouldDo === ShouldDoType.SET_ON_DUTY ? null : (
        <FormField errorMessage={errors.departments as string} label="Departments">
          <Select
            closeMenuOnSelect={false}
            name="departments"
            onChange={handleChange}
            value={values.departments}
            isMulti
            values={department.values.map((v) => ({
              value: v.id,
              label: v.value.value,
            }))}
          />
        </FormField>
      )}

      <FormField className="mb-0" checkbox label="Status Code">
        <Input
          className="w-[max-content] mr-3"
          type="radio"
          name="type"
          onChange={() => setFieldValue("type", "STATUS_CODE")}
          checked={values.type === "STATUS_CODE"}
        />
      </FormField>

      <FormField checkbox label="Situation Code">
        <Input
          className="w-[max-content] mr-3"
          type="radio"
          name="type"
          onChange={() => setFieldValue("type", "SITUATION_CODE")}
          checked={values.type === "SITUATION_CODE"}
        />
      </FormField>
    </>
  );
}
