import { Citizen, DriversLicenseCategoryType, ValueLicenseType } from "@snailycad/types";
import { useValues } from "context/ValuesContext";
import { useFormikContext } from "formik";
import { useFeatureEnabled } from "hooks/useFeatureEnabled";
import { useTranslations } from "next-intl";

import { FormField } from "components/form/FormField";
import { Select } from "components/form/Select";
import { filterLicenseTypes } from "lib/utils";
import { classNames } from "lib/classNames";
import { Toggle } from "components/form/Toggle";
import type { LicenseInitialValues } from "./ManageLicensesModal";
import { FormRow } from "components/form/FormRow";
import { DatePickerField } from "@snailycad/ui";

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
        <section className="w-full">
          {isLeo ? (
            <FormRow>
              <FormField label={t("Leo.suspendDriversLicense")}>
                <Toggle
                  onCheckedChange={handleChange}
                  name="suspended.driverLicense"
                  value={values.suspended.driverLicense}
                  onChange={handleChange}
                />
              </FormField>

              {values.suspended.driverLicense ? (
                <DatePickerField
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
            <FormField errorMessage={errors.driversLicense} label={t("Citizen.driversLicense")}>
              <Select
                disabled={values.suspended.driverLicense}
                isClearable={allowRemoval}
                values={filterLicenseTypes(license.values, ValueLicenseType.LICENSE).map(
                  (license) => ({
                    label: license.value,
                    value: license.id,
                  }),
                )}
                value={values.driversLicense}
                name="driversLicense"
                onChange={handleChange}
              />
            </FormField>
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
            <FormField label={t("suspendPilotLicense")} checkbox>
              <Toggle
                onCheckedChange={handleChange}
                name="suspended.pilotLicense"
                value={values.suspended.pilotLicense}
                onChange={handleChange}
              />
            </FormField>

            {values.suspended.pilotLicense ? (
              <DatePickerField
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
          <FormField errorMessage={errors.pilotLicense} label={t("Citizen.pilotLicense")}>
            <Select
              disabled={values.suspended.pilotLicense}
              isClearable={allowRemoval}
              values={filterLicenseTypes(license.values, ValueLicenseType.LICENSE).map(
                (license) => ({
                  label: license.value,
                  value: license.id,
                }),
              )}
              value={values.pilotLicense}
              name="pilotLicense"
              onChange={handleChange}
            />
          </FormField>
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
            <FormField label={t("Leo.suspendWaterLicense")} checkbox>
              <Toggle
                onCheckedChange={handleChange}
                name="suspended.waterLicense"
                value={values.suspended.waterLicense}
                onChange={handleChange}
              />
            </FormField>

            {values.suspended.waterLicense ? (
              <DatePickerField
                isOptional
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
          <FormField errorMessage={errors.waterLicense} label={t("Citizen.waterLicense")}>
            <Select
              disabled={values.suspended.waterLicense}
              isClearable={allowRemoval}
              values={filterLicenseTypes(license.values, ValueLicenseType.LICENSE).map(
                (license) => ({
                  label: license.value,
                  value: license.id,
                }),
              )}
              value={values.waterLicense}
              name="waterLicense"
              onChange={handleChange}
            />
          </FormField>
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
              <FormField label={t("Leo.suspendFirearmsLicense")} checkbox>
                <Toggle
                  onCheckedChange={handleChange}
                  name="suspended.firearmsLicense"
                  value={values.suspended.firearmsLicense}
                  onChange={handleChange}
                />
              </FormField>

              {values.suspended.firearmsLicense ? (
                <DatePickerField
                  isOptional
                  label={t("Leo.endDate")}
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
            <FormField errorMessage={errors.weaponLicense} label={t("Citizen.weaponLicense")}>
              <Select
                disabled={values.suspended.firearmsLicense}
                values={filterLicenseTypes(license.values, ValueLicenseType.LICENSE).map((v) => ({
                  label: v.value,
                  value: v.id,
                }))}
                value={values.weaponLicense}
                onChange={handleChange}
                name="weaponLicense"
                isClearable
              />
            </FormField>
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
