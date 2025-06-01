import { FormField } from "components/form/FormField";
import { useFormikContext } from "formik";
import dynamic from "next/dynamic";
import { type AnyValue, ShouldDoType, StatusValueType, WhatPages } from "@snailycad/types";

import { Eyedropper } from "react-bootstrap-icons";
import { Input, Button, SelectField, RadioGroupField, Radio } from "@snailycad/ui";
import { useValues } from "context/ValuesContext";
import { useTranslations } from "use-intl";
import { isOfficerRankValue } from "@snailycad/utils";
import type { ManageValueFormValues } from "../ManageValueModal";
import { generateContrastColor } from "lib/table/get-contrasting-text-color";

const HexColorPicker = dynamic(async () => (await import("react-colorful")).HexColorPicker);

export const SHOULD_DO_LABELS: Record<ShouldDoType, string> = {
  [ShouldDoType.SET_STATUS]: "Set Status",
  [ShouldDoType.SET_OFF_DUTY]: "Set Off duty",
  [ShouldDoType.SET_ON_DUTY]: "Set On duty",
  [ShouldDoType.SET_ASSIGNED]: "Set Assigned",
  [ShouldDoType.PANIC_BUTTON]: "Panic Button",
  [ShouldDoType.EN_ROUTE]: "En Route",
  [ShouldDoType.ON_SCENE]: "On Scene",
  [ShouldDoType.UNAVAILABLE]: "Unavailable",
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

  const DEFAULT_DEPARTMENTS_VALUES = department.values.map((value) => value.id);
  const DEFAULT_DEPARTMENTS_LABELS = department.values.map((value) => value.value.value);

  function makeDefaultDepartmentsValues(value: AnyValue | null) {
    const departments = makeDefaultDepartments(value);
    return departments.length <= 0
      ? DEFAULT_DEPARTMENTS_VALUES
      : departments.map((value) => value.id);
  }

  function makeDefaultDepartmentsLabels(value: AnyValue | null) {
    const departments = makeDefaultDepartments(value);
    return departments.length <= 0
      ? DEFAULT_DEPARTMENTS_LABELS
      : departments.map((value) => value.value.value);
  }

  function makeDefaultDepartments(value: AnyValue | null) {
    if (!value) return [];
    const departments =
      (isOfficerRankValue(value)
        ? value.officerRankDepartments
        : "departments" in value
          ? value.departments
          : []) ?? [];

    return departments;
  }

  return { makeDefaultDepartmentsValues, makeDefaultDepartmentsLabels };
}

export function StatusValueFields() {
  const { values, errors, setFieldValue, handleChange } = useFormikContext<ManageValueFormValues>();
  const { department } = useValues();
  const t = useTranslations("Values");

  return (
    <>
      <SelectField
        errorMessage={errors.shouldDo as string}
        label={t("shouldDo")}
        options={SHOULD_DO_VALUES}
        name="shouldDo"
        selectedKey={values.shouldDo}
        onSelectionChange={(key) => setFieldValue("shouldDo", key)}
      />

      <SelectField
        errorMessage={errors.whatPages as string}
        isClearable
        selectionMode="multiple"
        label={t("whatPages")}
        options={WHAT_PAGES_VALUES}
        name="whatPages"
        selectedKeys={values.whatPages ?? []}
        onSelectionChange={(keys) => setFieldValue("whatPages", keys)}
      />

      {values.shouldDo === ShouldDoType.SET_ON_DUTY ? null : (
        <SelectField
          label={t("departments")}
          errorMessage={errors.departments as string}
          selectedKeys={values.departments}
          onSelectionChange={(keys) => setFieldValue("departments", keys)}
          selectionMode="multiple"
          options={department.values.map((v) => ({
            value: v.id,
            label: v.value.value,
          }))}
        />
      )}

      <FormField errorMessage={errors.color as string} label={t("colorHex")}>
        <div className={`flex ${values.showPicker ? "items-start" : ""}`}>
          {values.showPicker ? (
            <HexColorPicker
              color={values.color}
              onChange={(color) => setFieldValue("color", color)}
              style={{ width: "100%", height: "150px" }}
            />
          ) : (
            <Input name="color" onChange={handleChange} value={values.color} />
          )}

          <Button
            variant="cancel"
            className="p-0 px-1 ml-2"
            type="button"
            onPress={() => setFieldValue("showPicker", !values.showPicker)}
            aria-label="Color Picker"
            title="Color Picker"
          >
            <Eyedropper />
          </Button>
        </div>
      </FormField>

      <FormField errorMessage={errors.textColor as string} label={t("textColor")}>
        <div className={`flex ${values.showPicker ? "items-start" : ""}`}>
          {values.showPicker ? (
            <HexColorPicker
              color={values.textColor}
              onChange={(textColor) => setFieldValue("textColor", textColor)}
              style={{ width: "100%", height: "150px" }}
            />
          ) : (
            <Input name="textColor" onChange={handleChange} value={values.textColor} />
          )}

          <Button
            variant="cancel"
            className="p-0 px-1 ml-2"
            type="button"
            onPress={() => setFieldValue("showPicker", !values.showPicker)}
            aria-label="Color Picker"
            title="Color Picker"
          >
            <Eyedropper />
          </Button>
        </div>
      </FormField>

      <RadioGroupField
        value={values.type!}
        onChange={(value) => setFieldValue("type", value)}
        label={t("codeType")}
      >
        <Radio value={StatusValueType.STATUS_CODE}>Status Code</Radio>
        <Radio value={StatusValueType.SITUATION_CODE}>Situation Code</Radio>
      </RadioGroupField>

      <section className="mt-3">
        <h3 className="text-lg font-medium mb-1">Color Preview</h3>

        <div
          style={{
            backgroundColor: values.color,
            color: values.color
              ? values.textColor || generateContrastColor(values.color)
              : values.textColor,
          }}
          className="w-full p-3 text-center rounded font-medium"
        >
          Lorem ipsum dolor sit.
        </div>
      </section>
    </>
  );
}
