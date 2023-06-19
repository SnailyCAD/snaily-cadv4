import { Citizen, DriversLicenseCategoryType, ValueLicenseType, ValueType } from "@snailycad/types";
import { useValues } from "context/ValuesContext";
import { useFormikContext } from "formik";
import { useFeatureEnabled } from "hooks/useFeatureEnabled";
import { useTranslations } from "next-intl";

import { FormField } from "components/form/FormField";
import { Select } from "components/form/Select";
import { filterLicenseType, filterLicenseTypes } from "lib/utils";
import { classNames } from "lib/classNames";
import type { LicenseInitialValues } from "./manage-licenses-modal";
import { FormRow, DatePickerField, SwitchField } from "@snailycad/ui";
import { ValueSelectField } from "components/form/inputs/value-select-field";

export function createDefaultLicensesValues(citizen: Citizen | null): LicenseInitialValues {
  return {
    suspended: {
      driverLicense: citizen?.suspendedLicenses?.driverLicense ?? false,
      driverLicenseTimeEnd: citizen?.suspendedLicenses?.driverLicenseTimeEnd ?? null,
      pilotLicense: citizen?.suspendedLicenses?.pilotLicense ?? false,
      pilotLicenseTimeEnd: citizen?.suspendedLicenses?.pilotLicenseTimeEnd ?? null,
      firearmsLicense: citizen?.suspendedLicenses?.firearmsLicense ?? false,
      firearmsLicenseTimeEnd: citizen?.suspendedLicenses?.firearmsLicenseTimeEnd ?? null,
      waterLicense: citizen?.suspendedLicenses?.waterLicense ?? false,
      waterLicenseTimeEnd: citizen?.suspendedLicenses?.waterLicenseTimeEnd ?? null,
    },
    driversLicense: citizen?.driversLicenseId ?? null,
    pilotLicense: citizen?.pilotLicenseId ?? null,
    weaponLicense: citizen?.weaponLicenseId ?? null,
    waterLicense: citizen?.waterLicenseId ?? null,
    driversLicenseCategory:
      citizen?.dlCategory
        .filter((v) => v.type === DriversLicenseCategoryType.AUTOMOTIVE)
        .map((v) => ({
          value: v.id,
          label: v.value.value,
          description: v.description,
        })) ?? null,
    pilotLicenseCategory:
      citizen?.dlCategory
        .filter((v) => v.type === DriversLicenseCategoryType.AVIATION)
        .map((v) => ({
          value: v.id,
          label: v.value.value,
          description: v.description,
        })) ?? null,
    waterLicenseCategory:
      citizen?.dlCategory
        .filter((v) => v.type === DriversLicenseCategoryType.WATER)
        .map((v) => ({
          value: v.id,
          label: v.value.value,
          description: v.description,
        })) ?? null,
    firearmLicenseCategory:
      citizen?.dlCategory
        .filter((v) => v.type === DriversLicenseCategoryType.FIREARM)
        .map((v) => ({
          value: v.id,
          label: v.value.value,
          description: v.description,
        })) ?? null,
  };
}

interface Props {
  isLeo?: boolean;
  allowRemoval?: boolean;
  flexType: "row" | "column";
}

export function ManageLicensesFormFields({ isLeo, allowRemoval, flexType }: Props) {
  const { values, setFieldValue, errors, handleChange } =
    useFormikContext<ReturnType<typeof createDefaultLicensesValues>>();

  const { license, driverslicenseCategory } = useValues();
  const t = useTranslations();
  const { WEAPON_REGISTRATION, LICENSE_EXAMS } = useFeatureEnabled();
  const formRowClassName = classNames(
    "w-full",
    flexType === "row" ? "grid grid-cols-2 gap-2" : "flex flex-col",
  );

  return (
    <>
      {LICENSE_EXAMS && !isLeo ? null : (
        <section className="w-full mt-3">
          {isLeo ? (
            <FormRow>
              <SwitchField
                isSelected={values.suspended.driverLicense}
                onChange={(isSelected) => setFieldValue("suspended.driverLicense", isSelected)}
              >
                {t("Leo.suspendDriversLicense")}
              </SwitchField>

              {values.suspended.driverLicense ? (
                <DatePickerField
                  errorMessage={errors.suspended?.driverLicenseTimeEnd}
                  isOptional
                  label={t("Leo.endDate")}
                  value={
                    values.suspended.driverLicenseTimeEnd
                      ? values.suspended.driverLicenseTimeEnd
                      : undefined
                  }
                  onChange={(value) =>
                    setFieldValue("suspended.driverLicenseTimeEnd", value?.toDate("UTC"))
                  }
                />
              ) : null}
            </FormRow>
          ) : null}

          <div className={formRowClassName}>
            <ValueSelectField
              isDisabled={values.suspended.driverLicense}
              isClearable={allowRemoval}
              fieldName="driversLicense"
              valueType={ValueType.LICENSE}
              values={filterLicenseTypes(license.values, ValueLicenseType.LICENSE)}
              label={t("Citizen.driversLicense")}
              filterFn={(v) => filterLicenseType(v, ValueLicenseType.LICENSE)}
            />

            <FormField
              errorMessage={errors.driversLicenseCategory as string}
              label={t("Citizen.driversLicenseCategory")}
            >
              <Select
                disabled={values.suspended.driverLicense}
                extra={{ showDLCategoryDescriptions: true }}
                isMulti
                values={driverslicenseCategory.values
                  .filter((v) => v.type === DriversLicenseCategoryType.AUTOMOTIVE)
                  .map((category) => ({
                    label: category.value.value,
                    value: category.id,
                    description: category.description,
                  }))}
                value={values.driversLicenseCategory}
                name="driversLicenseCategory"
                onChange={handleChange}
              />
            </FormField>
          </div>

          {!isLeo && values.suspended.driverLicense ? (
            <p className="-mt-2 text-base mb-3 text-neutral-700 dark:text-gray-400">
              {t("Citizen.licenseSuspendedInfo")}
            </p>
          ) : null}

          {isLeo ? (
            <hr className="my-2 mb-3 border-t border-secondary dark:border-quinary" />
          ) : null}
        </section>
      )}

      <section className="w-full">
        {isLeo ? (
          <FormRow>
            <SwitchField
              isSelected={values.suspended.pilotLicense}
              onChange={(isSelected) => setFieldValue("suspended.pilotLicense", isSelected)}
            >
              {t("Leo.suspendPilotLicense")}
            </SwitchField>

            {values.suspended.pilotLicense ? (
              <DatePickerField
                errorMessage={errors.suspended?.pilotLicenseTimeEnd}
                isOptional
                label={t("Leo.endDate")}
                value={
                  values.suspended.pilotLicenseTimeEnd
                    ? values.suspended.pilotLicenseTimeEnd
                    : undefined
                }
                onChange={(value) =>
                  setFieldValue("suspended.pilotLicenseTimeEnd", value?.toDate("UTC"))
                }
              />
            ) : null}
          </FormRow>
        ) : null}

        <div className={formRowClassName}>
          <ValueSelectField
            isDisabled={values.suspended.pilotLicense}
            isClearable={allowRemoval}
            fieldName="pilotLicense"
            valueType={ValueType.LICENSE}
            values={filterLicenseTypes(license.values, ValueLicenseType.LICENSE)}
            label={t("Citizen.pilotLicense")}
            filterFn={(v) => filterLicenseType(v, ValueLicenseType.LICENSE)}
          />

          <FormField
            errorMessage={errors.pilotLicenseCategory as string}
            label={t("Citizen.pilotLicenseCategory")}
          >
            <Select
              disabled={values.suspended.pilotLicense}
              isMulti
              extra={{ showDLCategoryDescriptions: true }}
              values={driverslicenseCategory.values
                .filter((v) => v.type === DriversLicenseCategoryType.AVIATION)
                .map((category) => ({
                  label: category.value.value,
                  value: category.id,
                  description: category.description,
                }))}
              value={values.pilotLicenseCategory}
              name="pilotLicenseCategory"
              onChange={handleChange}
            />
          </FormField>
        </div>

        {!isLeo && values.suspended.pilotLicense ? (
          <p className="-mt-2 text-base mb-3 text-neutral-700 dark:text-gray-400">
            {t("Citizen.licenseSuspendedInfo")}
          </p>
        ) : null}

        {isLeo ? <hr className="my-2 mb-3 border-t border-secondary dark:border-quinary" /> : null}
      </section>

      <section className="w-full">
        {isLeo ? (
          <FormRow>
            <SwitchField
              isSelected={values.suspended.waterLicense}
              onChange={(isSelected) => setFieldValue("suspended.waterLicense", isSelected)}
            >
              {t("Leo.suspendWaterLicense")}
            </SwitchField>

            {values.suspended.waterLicense ? (
              <DatePickerField
                isOptional
                errorMessage={errors.suspended?.waterLicenseTimeEnd}
                label={t("Leo.endDate")}
                value={
                  values.suspended.waterLicenseTimeEnd
                    ? values.suspended.waterLicenseTimeEnd
                    : undefined
                }
                onChange={(value) =>
                  setFieldValue("suspended.waterLicenseTimeEnd", value?.toDate("UTC"))
                }
              />
            ) : null}
          </FormRow>
        ) : null}

        <div className={formRowClassName}>
          <ValueSelectField
            isClearable={allowRemoval}
            fieldName="waterLicense"
            valueType={ValueType.LICENSE}
            values={filterLicenseTypes(license.values, ValueLicenseType.LICENSE)}
            filterFn={(v) => filterLicenseType(v, ValueLicenseType.LICENSE)}
            isDisabled={values.suspended.waterLicense}
            label={t("Citizen.waterLicense")}
          />

          <FormField
            errorMessage={errors.waterLicenseCategory as string}
            label={t("Citizen.waterLicenseCategory")}
          >
            <Select
              disabled={values.suspended.waterLicense}
              isMulti
              extra={{ showDLCategoryDescriptions: true }}
              values={driverslicenseCategory.values
                .filter((v) => v.type === DriversLicenseCategoryType.WATER)
                .map((category) => ({
                  label: category.value.value,
                  value: category.id,
                  description: category.description,
                }))}
              value={values.waterLicenseCategory}
              name="waterLicenseCategory"
              onChange={handleChange}
            />
          </FormField>
        </div>

        {!isLeo && values.suspended.waterLicense ? (
          <p className="-mt-2 text-base mb-3 text-neutral-700 dark:text-gray-400">
            {t("Citizen.licenseSuspendedInfo")}
          </p>
        ) : null}

        {isLeo ? <hr className="my-2 mb-3 border-t border-secondary dark:border-quinary" /> : null}
      </section>

      {!WEAPON_REGISTRATION ? null : LICENSE_EXAMS && !isLeo ? null : (
        <section className="w-full">
          {isLeo ? (
            <FormRow>
              <SwitchField
                isSelected={values.suspended.firearmsLicense}
                onChange={(isSelected) => setFieldValue("suspended.firearmsLicense", isSelected)}
              >
                {t("Leo.suspendFirearmsLicense")}
              </SwitchField>

              {values.suspended.firearmsLicense ? (
                <DatePickerField
                  isOptional
                  label={t("Leo.endDate")}
                  errorMessage={errors.suspended?.firearmsLicenseTimeEnd}
                  value={
                    values.suspended.firearmsLicenseTimeEnd
                      ? values.suspended.firearmsLicenseTimeEnd
                      : undefined
                  }
                  onChange={(value) =>
                    setFieldValue("suspended.firearmsLicenseTimeEnd", value?.toDate("UTC"))
                  }
                />
              ) : null}
            </FormRow>
          ) : null}

          <div className={formRowClassName}>
            <ValueSelectField
              isClearable={allowRemoval}
              fieldName="weaponLicense"
              valueType={ValueType.LICENSE}
              values={filterLicenseTypes(license.values, ValueLicenseType.LICENSE)}
              filterFn={(v) => filterLicenseType(v, ValueLicenseType.LICENSE)}
              isDisabled={values.suspended.firearmsLicense}
              label={t("Citizen.weaponLicense")}
            />

            <FormField
              errorMessage={errors.firearmLicenseCategory as string}
              label={t("Citizen.firearmLicenseCategory")}
            >
              <Select
                disabled={values.suspended.firearmsLicense}
                extra={{ showDLCategoryDescriptions: true }}
                values={driverslicenseCategory.values
                  .filter((v) => v.type === DriversLicenseCategoryType.FIREARM)
                  .map((v) => ({
                    label: v.value.value,
                    value: v.id,
                  }))}
                value={values.firearmLicenseCategory}
                onChange={handleChange}
                name="firearmLicenseCategory"
                isMulti
                isClearable
              />
            </FormField>
          </div>

          {!isLeo && values.suspended.firearmsLicense ? (
            <p className="-mt-2 text-base mb-3 text-neutral-700 dark:text-gray-400">
              {t("Citizen.licenseSuspendedInfo")}
            </p>
          ) : null}
        </section>
      )}
    </>
  );
}
