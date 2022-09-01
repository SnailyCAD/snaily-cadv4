import { Citizen, DriversLicenseCategoryType, ValueLicenseType } from "@snailycad/types";
import { useValues } from "context/ValuesContext";
import { useFormikContext } from "formik";
import { useFeatureEnabled } from "hooks/useFeatureEnabled";
import { useTranslations } from "next-intl";

import { FormField } from "components/form/FormField";
import { Select } from "components/form/Select";
import { filterLicenseTypes } from "lib/utils";
import { classNames } from "lib/classNames";

export function createDefaultLicensesValues(citizen: Citizen | null) {
  return {
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
  const { values, errors, handleChange } =
    useFormikContext<ReturnType<typeof createDefaultLicensesValues>>();

  const { license, driverslicenseCategory } = useValues();
  const t = useTranslations("Citizen");
  const { WEAPON_REGISTRATION, WEAPON_EXAMS, DL_EXAMS } = useFeatureEnabled();
  const formRowClassName = classNames(
    "w-full",
    flexType === "row" ? "grid grid-cols-2 gap-2" : "flex flex-col",
  );

  return (
    <>
      {DL_EXAMS && !isLeo ? null : (
        <div className={formRowClassName}>
          <FormField errorMessage={errors.driversLicense} label={t("driversLicense")}>
            <Select
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
            label={t("driversLicenseCategory")}
          >
            <Select
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
      )}

      <div className={formRowClassName}>
        <FormField errorMessage={errors.pilotLicense} label={t("pilotLicense")}>
          <Select
            isClearable={allowRemoval}
            values={filterLicenseTypes(license.values, ValueLicenseType.LICENSE).map((license) => ({
              label: license.value,
              value: license.id,
            }))}
            value={values.pilotLicense}
            name="pilotLicense"
            onChange={handleChange}
          />
        </FormField>

        <FormField
          errorMessage={errors.pilotLicenseCategory as string}
          label={t("pilotLicenseCategory")}
        >
          <Select
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

      <div className={formRowClassName}>
        <FormField errorMessage={errors.waterLicense} label={t("waterLicense")}>
          <Select
            isClearable={allowRemoval}
            values={filterLicenseTypes(license.values, ValueLicenseType.LICENSE).map((license) => ({
              label: license.value,
              value: license.id,
            }))}
            value={values.waterLicense}
            name="waterLicense"
            onChange={handleChange}
          />
        </FormField>

        <FormField
          errorMessage={errors.waterLicenseCategory as string}
          label={t("waterLicenseCategory")}
        >
          <Select
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

      {WEAPON_REGISTRATION && !WEAPON_EXAMS ? (
        <div className={formRowClassName}>
          <FormField errorMessage={errors.weaponLicense} label={t("weaponLicense")}>
            <Select
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
            label={t("firearmLicenseCategory")}
          >
            <Select
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
      ) : null}
    </>
  );
}
