import { FormField } from "components/form/FormField";
import { CheckboxField, Input, Textarea } from "@snailycad/ui";
import type { SelectValue } from "components/form/Select";
import { useFormikContext } from "formik";
import { useTranslations } from "next-intl";
import type { PenalCode } from "@snailycad/types";
import React from "react";
import { useFeatureEnabled } from "hooks/useFeatureEnabled";
import { type createInitialRecordValues } from "./manage-record-modal";

type PenalCodeValueName = "counts" | "fine" | "jailTime" | "bail" | "communityService";
interface PenalCodeValue<Name extends PenalCodeValueName> {
  value: Name extends "counts" ? string | null : number | null;
  enabled: boolean;
}

interface ExtendedPenalCode extends PenalCode {
  counts?: PenalCodeValue<"counts">;
  fine?: PenalCodeValue<"fine">;
  jailTime?: PenalCodeValue<"jailTime">;
  bail?: PenalCodeValue<"bail">;
  communityService?: PenalCodeValue<"communityService">;
}

interface Props {
  penalCode: ExtendedPenalCode;
  isReadOnly?: boolean;
}

function hasFines(penalCode: PenalCode) {
  const fines1 = penalCode.warningApplicable?.fines;
  const fines2 = penalCode.warningNotApplicable?.fines;

  return Boolean(fines1 || fines2);
}

export function getPenalCodeMinFines(penalCode: PenalCode) {
  const fines1 = penalCode.warningApplicable?.fines ?? [];
  const fines2 = penalCode.warningNotApplicable?.fines ?? [];

  if (fines1.length > 0 && fines2.length > 0) {
    return Math.min(...fines1, ...fines2);
  }

  if (fines1.length > 0) {
    return Math.min(...fines1);
  }

  if (fines2.length > 0) {
    return Math.min(...fines2);
  }

  return 0;
}

export function getPenalCodeMaxFines(penalCode: PenalCode) {
  const fines1 = penalCode.warningApplicable?.fines ?? [];
  const fines2 = penalCode.warningNotApplicable?.fines ?? [];

  if (fines1.length > 0 && fines2.length > 0) {
    return Math.max(...fines1, ...fines2);
  }

  if (fines1.length > 0) {
    return Math.max(...fines1);
  }

  if (fines2.length > 0) {
    return Math.max(...fines2);
  }

  return 0;
}

interface HandleValueChangeOptions {
  fieldName: "counts" | "fine" | "jailTime" | "bail" | "communityService";
  enabled?: boolean;
  event?: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>;
}

export function TableItemForm({ penalCode, isReadOnly }: Props) {
  const t = useTranslations("Leo");
  const { LEO_BAIL } = useFeatureEnabled();
  const isDeleted = !penalCode.id;

  const minFine = getPenalCodeMinFines(penalCode);
  const maxFine = getPenalCodeMaxFines(penalCode);

  const [minJailTime, maxJailTime] = penalCode.warningNotApplicable?.prisonTerm ?? [];
  const [minBail, maxBail] = penalCode.warningNotApplicable?.bail ?? [];

  const jailTimeDisabled =
    isDeleted || isReadOnly || !penalCode.warningNotApplicable?.prisonTerm.length;
  const bailDisabled = isDeleted || isReadOnly || !penalCode.warningNotApplicable?.bail.length;
  const warningNotApplicableDisabled =
    isDeleted || isReadOnly || !penalCode.warningNotApplicableId || jailTimeDisabled;
  const finesDisabled = isDeleted || isReadOnly || !hasFines(penalCode);

  const { setFieldValue, values, errors } =
    useFormikContext<ReturnType<typeof createInitialRecordValues>>();
  const violationErrors = (errors.violations ?? {}) as Record<
    string,
    Record<PenalCodeValueName, string>
  >;

  const current = values.violations.find(
    (v: SelectValue<Partial<PenalCode>>) => v.value?.id === penalCode.id,
  );

  const currentValue = parseCurrentValue(current?.value ?? null);

  const handleValueChange = (options: HandleValueChangeOptions) => {
    const idx = values.violations.findIndex((v) => v.value.id === penalCode.id);
    const updatedArr = [...values.violations] as { label: string; value: ExtendedPenalCode }[];
    const newValue = options.event?.target.value ?? penalCode[options.fieldName]?.value ?? "";

    if (options.fieldName === "counts") {
      const int = parseInt(String(newValue));
      if (int > 10) {
        return;
      }
    }

    updatedArr[idx] = {
      label: penalCode.title,
      value: {
        ...penalCode,
        [options.fieldName]: {
          enabled: options.enabled ?? penalCode[options.fieldName]?.enabled ?? true,
          value: newValue,
        },
      },
    };
    setFieldValue("violations", updatedArr);
  };

  const jailTimeBailDescription = (
    <span className="text-sm">
      <b>{t("jailTime")}: </b> <b>Min:</b> {minJailTime} <b>Max:</b> {maxJailTime}
      <span className="mx-[39px]" />
      {bailDisabled ? null : (
        <>
          <b>{t("bail")}: </b> <b>Min:</b> {minBail} <b>Max:</b> {maxBail}
        </>
      )}
    </span>
  );

  const countDescription = (
    <span className="text-sm">
      <b>Counts: </b> <b>Min:</b> {1} <b>Max:</b> {10}
    </span>
  );

  const finesDescription = (
    <span className="text-sm">
      <b>{t("fines")}: </b> <b>Min:</b> {minFine} <b>Max:</b> {maxFine}
    </span>
  );

  return (
    <div className="flex flex-row gap-5">
      <FieldWrapper description={countDescription}>
        <FormField className="!mb-0" label={t("counts")}>
          <Input
            max={10}
            min={1}
            name="fine.counts"
            onChange={(event) => handleValueChange({ fieldName: "counts", event })}
            type="number"
            disabled={isDeleted || isReadOnly}
            className="max-w-[125px] min-w-[125px] py-0.5"
            value={transformField(currentValue.counts.value, "1")}
          />
        </FormField>
      </FieldWrapper>

      <div className="flex flex-col">
        <FieldWrapper
          errorMessage={violationErrors[penalCode.id]?.fine}
          description={finesDisabled ? null : finesDescription}
        >
          <div className="flex items-center">
            <CheckboxField
              isDisabled={finesDisabled}
              isSelected={currentValue.fine.enabled}
              className="mb-0"
              onChange={(isSelected) =>
                handleValueChange({
                  fieldName: "fine",
                  enabled: isSelected,
                })
              }
            >
              {t("fines")}
            </CheckboxField>

            <Input
              name="fine.value"
              onChange={(event) => handleValueChange({ fieldName: "fine", event })}
              min={minFine}
              max={maxFine}
              type="number"
              disabled={isDeleted || isReadOnly || !currentValue.fine.enabled}
              className="max-w-[125px] min-w-[125px] ml-5 py-0.5"
              value={
                !isNaN(parseFloat(String(currentValue.fine.value))) ? currentValue.fine.value : ""
              }
            />
          </div>
        </FieldWrapper>
        <FieldWrapper errorMessage={violationErrors[penalCode.id]?.communityService}>
          <div className="flex items-center">
            <CheckboxField
              isDisabled={isDeleted || isReadOnly}
              isSelected={currentValue.communityService.enabled}
              className="mb-0"
              onChange={(isSelected) =>
                handleValueChange({ fieldName: "communityService", enabled: isSelected })
              }
            >
              {t("communityService")}
            </CheckboxField>

            <Textarea
              name="communityService.value"
              onChange={(event) => handleValueChange({ fieldName: "communityService", event })}
              disabled={isDeleted || isReadOnly || !currentValue.communityService.enabled}
              className="max-w-[250px] min-w-[250px] ml-5 py-0.5"
              value={currentValue.communityService.value}
            />
          </div>
        </FieldWrapper>
        <FieldWrapper
          errorMessage={
            violationErrors[penalCode.id]?.jailTime || violationErrors[penalCode.id]?.bail
          }
          description={jailTimeDisabled ? null : jailTimeBailDescription}
        >
          <div className="flex items-center mt-1">
            <CheckboxField
              isDisabled={warningNotApplicableDisabled}
              isSelected={currentValue.jailTime.enabled}
              className="mb-0"
              onChange={(isSelected) =>
                handleValueChange({ fieldName: "jailTime", enabled: isSelected })
              }
            >
              {t("jailTime")}
            </CheckboxField>

            <Input
              name="jailTime.value"
              onChange={(event) => handleValueChange({ fieldName: "jailTime", event })}
              min={minJailTime}
              max={maxJailTime}
              type="number"
              disabled={
                isDeleted ||
                isReadOnly ||
                warningNotApplicableDisabled ||
                !currentValue.jailTime.enabled
              }
              className="max-w-[125px] min-w-[125px] ml-5 py-0.5"
              value={!isNaN(Number(currentValue.jailTime.value)) ? currentValue.jailTime.value : ""}
            />
            {LEO_BAIL ? (
              <div className="flex flex-row items-center mb-0 ml-5">
                <label>{t("bail")}</label>
                <Input
                  type="number"
                  onChange={(event) => handleValueChange({ fieldName: "bail", event })}
                  name="bail.value"
                  disabled={
                    isDeleted ||
                    isReadOnly ||
                    bailDisabled ||
                    warningNotApplicableDisabled ||
                    !currentValue.jailTime.enabled
                  }
                  className="py-0.5 min-w-[125px] max-w-[125px] ml-5"
                  value={!isNaN(Number(currentValue.bail.value)) ? currentValue.bail.value : ""}
                  min={minBail}
                  max={maxBail}
                />
              </div>
            ) : null}
          </div>
        </FieldWrapper>
      </div>
    </div>
  );
}

function FieldWrapper({
  children,
  errorMessage,
  description,
}: {
  children: React.ReactNode;
  errorMessage?: string;
  description?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col mb-2">
      {children}

      {errorMessage ? (
        <span className="mt-1 font-medium text-red-500">{errorMessage}</span>
      ) : description ? (
        <span className="mt-1 font-medium">{description}</span>
      ) : null}
    </div>
  );
}

/** appends default data to the current penal code */
export function parseCurrentValue(
  penalCode:
    | (Partial<PenalCode> & Partial<Record<PenalCodeValueName, PenalCodeValue<PenalCodeValueName>>>)
    | null,
) {
  return {
    ...(penalCode ?? {}),
    fine: { enabled: penalCode?.fine?.enabled ?? false, value: penalCode?.fine?.value ?? "" },
    jailTime: {
      enabled: penalCode?.jailTime?.enabled ?? false,
      value: penalCode?.jailTime?.value ?? "",
    },
    bail: { value: penalCode?.bail?.value ?? "" },
    communityService: {
      enabled: penalCode?.communityService?.enabled ?? false,
      value: penalCode?.communityService?.value ?? "",
    },
    counts: { value: penalCode?.counts?.value ?? "1" },
  };
}

/** automatically transform the value from a string or number to a stringified number */
function transformField(value: string | number | null, defaultValue: string) {
  if (value === null) return defaultValue;

  const stringified = String(value);

  if (isNaN(parseFloat(stringified))) return defaultValue;
  return stringified;
}
