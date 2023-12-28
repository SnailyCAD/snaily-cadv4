import {
  type Citizen,
  DriversLicenseCategoryType,
  ValueLicenseType,
  ValueType,
  LicenseExamType,
} from "@snailycad/types";
import { useValues } from "context/ValuesContext";
import { useFormikContext } from "formik";
import { useFeatureEnabled } from "hooks/useFeatureEnabled";
import { useTranslations } from "next-intl";
import { filterLicenseType, filterLicenseTypes } from "lib/utils";
import type { LicenseInitialValues } from "./manage-licenses-modal";
import { FormRow, DatePickerField, SwitchField, SelectField } from "@snailycad/ui";
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
      huntingLicense: citizen?.suspendedLicenses?.huntingLicense ?? false,
      huntingLicenseTimeEnd: citizen?.suspendedLicenses?.huntingLicenseTimeEnd ?? null,
      fishingLicense: citizen?.suspendedLicenses?.fishingLicense ?? false,
      fishingLicenseTimeEnd: citizen?.suspendedLicenses?.fishingLicenseTimeEnd ?? null,
    },
    driversLicense: citizen?.driversLicenseId ?? null,
    pilotLicense: citizen?.pilotLicenseId ?? null,
    weaponLicense: citizen?.weaponLicenseId ?? null,
    waterLicense: citizen?.waterLicenseId ?? null,
    fishingLicense: citizen?.fishingLicenseId ?? null,
    huntingLicense: citizen?.huntingLicenseId ?? null,
    driversLicenseCategory:
      citizen?.dlCategory
        .filter((v) => v.type === DriversLicenseCategoryType.AUTOMOTIVE)
        .map((v) => v.id) ?? [],
    pilotLicenseCategory:
      citizen?.dlCategory
        .filter((v) => v.type === DriversLicenseCategoryType.AVIATION)
        .map((v) => v.id) ?? [],
    waterLicenseCategory:
      citizen?.dlCategory
        .filter((v) => v.type === DriversLicenseCategoryType.WATER)
        .map((v) => v.id) ?? [],
    firearmLicenseCategory:
      citizen?.dlCategory
        .filter((v) => v.type === DriversLicenseCategoryType.FIREARM)
        .map((v) => v.id) ?? [],
    fishingLicenseCategory:
      citizen?.dlCategory
        .filter((v) => v.type === DriversLicenseCategoryType.FISHING)
        .map((v) => v.id) ?? [],
    huntingLicenseCategory:
      citizen?.dlCategory
        .filter((v) => v.type === DriversLicenseCategoryType.HUNTING)
        .map((v) => v.id) ?? [],
    otherLicenseCategory:
      citizen?.dlCategory
        .filter((v) => v.type === DriversLicenseCategoryType.OTHER)
        .map((v) => v.id) ?? [],
  };
}

interface Props {
  isLeo?: boolean;
  allowRemoval?: boolean;
}

export function ManageLicensesFormFields({ isLeo, allowRemoval }: Props) {
  const { values, setFieldValue, errors } =
    useFormikContext<ReturnType<typeof createDefaultLicensesValues>>();

  const { license, driverslicenseCategory } = useValues();
  const t = useTranslations();
  const { WEAPON_REGISTRATION, LICENSE_EXAMS, options } = useFeatureEnabled();

  const driversLicenseExamEnabled =
    LICENSE_EXAMS && options.LICENSE_EXAMS.includes(LicenseExamType.DRIVER);
  const pilotLicenseExamEnabled =
    LICENSE_EXAMS && options.LICENSE_EXAMS.includes(LicenseExamType.PILOT);
  const waterLicenseExamEnabled =
    LICENSE_EXAMS && options.LICENSE_EXAMS.includes(LicenseExamType.WATER);
  const fishingLicenseExamEnabled =
    LICENSE_EXAMS && options.LICENSE_EXAMS.includes(LicenseExamType.FISHING);
  const huntingLicenseExamEnabled =
    LICENSE_EXAMS && options.LICENSE_EXAMS.includes(LicenseExamType.HUNTING);
  const firearmsLicenseExamEnabled =
    LICENSE_EXAMS && options.LICENSE_EXAMS.includes(LicenseExamType.FIREARM);

  return (
    <>
      {driversLicenseExamEnabled && !isLeo ? null : (
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

          <FormRow>
            <ValueSelectField
              isOptional
              isClearable={allowRemoval}
              isDisabled={values.suspended.driverLicense}
              fieldName="driversLicense"
              valueType={ValueType.LICENSE}
              values={filterLicenseTypes(license.values, ValueLicenseType.LICENSE)}
              label={t("Citizen.driversLicense")}
              filterFn={(v) => filterLicenseType(v, ValueLicenseType.LICENSE)}
            />

            <SelectField
              label={t("Citizen.driversLicenseCategory")}
              errorMessage={errors.driversLicenseCategory}
              isDisabled={values.suspended.driverLicense}
              selectionMode="multiple"
              selectedKeys={values.driversLicenseCategory}
              isOptional
              isClearable={allowRemoval}
              onSelectionChange={(keys) => setFieldValue("driversLicenseCategory", keys)}
              options={driverslicenseCategory.values
                .filter((v) => v.type === DriversLicenseCategoryType.AUTOMOTIVE)
                .map((value) => ({
                  label: value.value.value,
                  value: value.id,
                  description: value.description,
                }))}
            />
          </FormRow>

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

      {pilotLicenseExamEnabled && !isLeo ? null : (
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

          <FormRow>
            <ValueSelectField
              isDisabled={values.suspended.pilotLicense}
              isOptional
              isClearable={allowRemoval}
              fieldName="pilotLicense"
              valueType={ValueType.LICENSE}
              values={filterLicenseTypes(license.values, ValueLicenseType.LICENSE)}
              label={t("Citizen.pilotLicense")}
              filterFn={(v) => filterLicenseType(v, ValueLicenseType.LICENSE)}
            />

            <SelectField
              label={t("Citizen.pilotLicenseCategory")}
              errorMessage={errors.pilotLicenseCategory}
              isDisabled={values.suspended.pilotLicense}
              selectionMode="multiple"
              selectedKeys={values.pilotLicenseCategory}
              isOptional
              isClearable={allowRemoval}
              onSelectionChange={(keys) => setFieldValue("pilotLicenseCategory", keys)}
              options={driverslicenseCategory.values
                .filter((v) => v.type === DriversLicenseCategoryType.AVIATION)
                .map((value) => ({
                  label: value.value.value,
                  value: value.id,
                  description: value.description,
                }))}
            />
          </FormRow>

          {!isLeo && values.suspended.pilotLicense ? (
            <p className="-mt-2 text-base mb-3 text-neutral-700 dark:text-gray-400">
              {t("Citizen.licenseSuspendedInfo")}
            </p>
          ) : null}

          {isLeo ? (
            <hr className="my-2 mb-3 border-t border-secondary dark:border-quinary" />
          ) : null}
        </section>
      )}

      {waterLicenseExamEnabled && !isLeo ? null : (
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

          <FormRow>
            <ValueSelectField
              isOptional
              isClearable={allowRemoval}
              fieldName="waterLicense"
              valueType={ValueType.LICENSE}
              values={filterLicenseTypes(license.values, ValueLicenseType.LICENSE)}
              filterFn={(v) => filterLicenseType(v, ValueLicenseType.LICENSE)}
              isDisabled={values.suspended.waterLicense}
              label={t("Citizen.waterLicense")}
            />

            <SelectField
              label={t("Citizen.waterLicenseCategory")}
              errorMessage={errors.waterLicenseCategory}
              isDisabled={values.suspended.waterLicense}
              selectionMode="multiple"
              selectedKeys={values.waterLicenseCategory}
              isOptional
              isClearable={allowRemoval}
              onSelectionChange={(keys) => setFieldValue("waterLicenseCategory", keys)}
              options={driverslicenseCategory.values
                .filter((v) => v.type === DriversLicenseCategoryType.WATER)
                .map((value) => ({
                  label: value.value.value,
                  value: value.id,
                  description: value.description,
                }))}
            />
          </FormRow>

          {!isLeo && values.suspended.waterLicense ? (
            <p className="-mt-2 text-base mb-3 text-neutral-700 dark:text-gray-400">
              {t("Citizen.licenseSuspendedInfo")}
            </p>
          ) : null}

          {isLeo ? (
            <hr className="my-2 mb-3 border-t border-secondary dark:border-quinary" />
          ) : null}
        </section>
      )}

      {fishingLicenseExamEnabled && !isLeo ? null : (
        <section className="w-full">
          {isLeo ? (
            <FormRow>
              <SwitchField
                isSelected={values.suspended.fishingLicense}
                onChange={(isSelected) => setFieldValue("suspended.fishingLicense", isSelected)}
              >
                {t("Leo.suspendFishingLicense")}
              </SwitchField>

              {values.suspended.fishingLicense ? (
                <DatePickerField
                  isOptional
                  errorMessage={errors.suspended?.fishingLicenseTimeEnd}
                  label={t("Leo.endDate")}
                  value={
                    values.suspended.fishingLicenseTimeEnd
                      ? values.suspended.fishingLicenseTimeEnd
                      : undefined
                  }
                  onChange={(value) =>
                    setFieldValue("suspended.fishingLicenseTimeEnd", value?.toDate("UTC"))
                  }
                />
              ) : null}
            </FormRow>
          ) : null}

          <FormRow>
            <ValueSelectField
              isOptional
              isClearable={allowRemoval}
              fieldName="fishingLicense"
              valueType={ValueType.LICENSE}
              values={filterLicenseTypes(license.values, ValueLicenseType.LICENSE)}
              filterFn={(v) => filterLicenseType(v, ValueLicenseType.LICENSE)}
              isDisabled={values.suspended.fishingLicense}
              label={t("Citizen.fishingLicense")}
            />

            <SelectField
              label={t("Citizen.fishingLicenseCategory")}
              errorMessage={errors.fishingLicenseCategory}
              isDisabled={values.suspended.fishingLicense}
              selectionMode="multiple"
              selectedKeys={values.fishingLicenseCategory}
              isOptional
              isClearable={allowRemoval}
              onSelectionChange={(keys) => setFieldValue("fishingLicenseCategory", keys)}
              options={driverslicenseCategory.values
                .filter((v) => v.type === DriversLicenseCategoryType.FISHING)
                .map((value) => ({
                  label: value.value.value,
                  value: value.id,
                  description: value.description,
                }))}
            />
          </FormRow>

          {!isLeo && values.suspended.fishingLicense ? (
            <p className="-mt-2 text-base mb-3 text-neutral-700 dark:text-gray-400">
              {t("Citizen.licenseSuspendedInfo")}
            </p>
          ) : null}

          {isLeo ? (
            <hr className="my-2 mb-3 border-t border-secondary dark:border-quinary" />
          ) : null}
        </section>
      )}

      {huntingLicenseExamEnabled && !isLeo ? null : (
        <section className="w-full">
          {isLeo ? (
            <FormRow>
              <SwitchField
                isSelected={values.suspended.huntingLicense}
                onChange={(isSelected) => setFieldValue("suspended.huntingLicense", isSelected)}
              >
                {t("Leo.suspendHuntingLicense")}
              </SwitchField>

              {values.suspended.huntingLicense ? (
                <DatePickerField
                  isOptional
                  errorMessage={errors.suspended?.huntingLicenseTimeEnd}
                  label={t("Leo.endDate")}
                  value={
                    values.suspended.huntingLicenseTimeEnd
                      ? values.suspended.huntingLicenseTimeEnd
                      : undefined
                  }
                  onChange={(value) =>
                    setFieldValue("suspended.huntingLicenseTimeEnd", value?.toDate("UTC"))
                  }
                />
              ) : null}
            </FormRow>
          ) : null}

          <FormRow>
            <ValueSelectField
              isOptional
              isClearable={allowRemoval}
              fieldName="huntingLicense"
              valueType={ValueType.LICENSE}
              values={filterLicenseTypes(license.values, ValueLicenseType.LICENSE)}
              filterFn={(v) => filterLicenseType(v, ValueLicenseType.LICENSE)}
              isDisabled={values.suspended.huntingLicense}
              label={t("Citizen.huntingLicense")}
            />

            <SelectField
              label={t("Citizen.huntingLicenseCategory")}
              errorMessage={errors.huntingLicenseCategory}
              isDisabled={values.suspended.huntingLicense}
              selectionMode="multiple"
              selectedKeys={values.huntingLicenseCategory}
              isOptional
              isClearable={allowRemoval}
              onSelectionChange={(keys) => setFieldValue("huntingLicenseCategory", keys)}
              options={driverslicenseCategory.values
                .filter((v) => v.type === DriversLicenseCategoryType.HUNTING)
                .map((value) => ({
                  label: value.value.value,
                  value: value.id,
                  description: value.description,
                }))}
            />
          </FormRow>

          {!isLeo && values.suspended.huntingLicense ? (
            <p className="-mt-2 text-base mb-3 text-neutral-700 dark:text-gray-400">
              {t("Citizen.licenseSuspendedInfo")}
            </p>
          ) : null}

          {isLeo ? (
            <hr className="my-2 mb-3 border-t border-secondary dark:border-quinary" />
          ) : null}
        </section>
      )}

      {!WEAPON_REGISTRATION ? null : firearmsLicenseExamEnabled && !isLeo ? null : (
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

          <FormRow>
            <ValueSelectField
              isOptional
              isClearable={allowRemoval}
              fieldName="weaponLicense"
              valueType={ValueType.LICENSE}
              values={filterLicenseTypes(license.values, ValueLicenseType.LICENSE)}
              filterFn={(v) => filterLicenseType(v, ValueLicenseType.LICENSE)}
              isDisabled={values.suspended.firearmsLicense}
              label={t("Citizen.weaponLicense")}
            />

            <SelectField
              label={t("Citizen.firearmLicenseCategory")}
              errorMessage={errors.firearmLicenseCategory}
              isDisabled={values.suspended.firearmsLicense}
              selectionMode="multiple"
              selectedKeys={values.firearmLicenseCategory}
              isOptional
              isClearable={allowRemoval}
              onSelectionChange={(keys) => setFieldValue("firearmLicenseCategory", keys)}
              options={driverslicenseCategory.values
                .filter((v) => v.type === DriversLicenseCategoryType.FIREARM)
                .map((value) => ({
                  label: value.value.value,
                  value: value.id,
                  description: value.description,
                }))}
            />
          </FormRow>

          {!isLeo && values.suspended.firearmsLicense ? (
            <p className="-mt-2 text-base mb-3 text-neutral-700 dark:text-gray-400">
              {t("Citizen.licenseSuspendedInfo")}
            </p>
          ) : null}
        </section>
      )}

      <section className="w-full">
        <FormRow>
          <SelectField
            label={t("Citizen.otherLicenseCategory")}
            errorMessage={errors.otherLicenseCategory}
            selectionMode="multiple"
            selectedKeys={values.otherLicenseCategory}
            isOptional
            isClearable={allowRemoval}
            onSelectionChange={(keys) => setFieldValue("otherLicenseCategory", keys)}
            options={driverslicenseCategory.values
              .filter((v) => v.type === DriversLicenseCategoryType.OTHER)
              .map((value) => ({
                label: value.value.value,
                value: value.id,
                description: value.description,
              }))}
          />
        </FormRow>
      </section>
    </>
  );
}
