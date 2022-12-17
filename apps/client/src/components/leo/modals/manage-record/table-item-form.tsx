import { FormField } from "components/form/FormField";
import { Input } from "@snailycad/ui";
import type { SelectValue } from "components/form/Select";
import { useFormikContext } from "formik";
import { useTranslations } from "next-intl";
import type { PenalCode } from "@snailycad/types";
import type React from "react";
import { useFeatureEnabled } from "hooks/useFeatureEnabled";
import { Checkbox } from "components/form/inputs/Checkbox";

interface Props {
  penalCode: PenalCode;
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

export function TableItemForm({ penalCode, isReadOnly }: Props) {
  const t = useTranslations("Leo");
  const { LEO_BAIL } = useFeatureEnabled();

  const minFine = getPenalCodeMinFines(penalCode);
  const maxFine = getPenalCodeMaxFines(penalCode);

  const [minJailTime, maxJailTime] = penalCode.warningNotApplicable?.prisonTerm ?? [];
  const [minBail, maxBail] = penalCode.warningNotApplicable?.bail ?? [];

  const jailTimeDisabled = isReadOnly || !penalCode.warningNotApplicable?.prisonTerm.length;
  const bailDisabled = isReadOnly || !penalCode.warningNotApplicable?.bail.length;
  const warningNotApplicableDisabled =
    isReadOnly || !penalCode.warningNotApplicableId || jailTimeDisabled;
  const finesDisabled = isReadOnly || !hasFines(penalCode);

  const { setFieldValue, values, errors } = useFormikContext<any>();
  const violationErrors = (errors.violations ?? {}) as Record<
    string,
    { fine?: string; jailTime?: string; bail?: string; counts?: string }
  >;

  const current = values.violations.find(
    (v: SelectValue<PenalCode>) => v.value?.id === penalCode.id,
  );

  const currentValue = current?.value ?? {
    fine: { enabled: false, value: "" },
    jailTime: { enabled: false, value: "" },
    bail: { value: "" },
    counts: 1,
  };

  const handleValueChange = (
    fieldName: string,
    enabled?: boolean,
    e?: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const idx = (values.violations as SelectValue<PenalCode>[]).findIndex(
      (v) => v.value?.id === penalCode.id,
    );

    const updatedArr = [...values.violations] as SelectValue<PenalCode>[];

    const newValue = e?.target.valueAsNumber ?? (penalCode as any)[fieldName]?.value ?? "";

    if (fieldName === "counts") {
      const int = parseInt(newValue);
      if (int > 10) {
        return;
      }
    }

    updatedArr[idx] = {
      label: penalCode.title,
      value: {
        ...penalCode,
        [fieldName]: {
          enabled: enabled ?? (penalCode as any)[fieldName]?.enabled ?? true,
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
        <FormField className="!mb-0" label="Counts">
          <Input
            max={10}
            min={1}
            name="fine.counts"
            onChange={handleValueChange.bind(null, "counts", undefined)}
            type="number"
            disabled={isReadOnly}
            className="max-w-[125px] min-w-[125px] py-0.5"
            value={!isNaN(currentValue.counts?.value) ? currentValue.counts?.value : ""}
          />
        </FormField>
      </FieldWrapper>

      <div className="flex flex-col">
        <FieldWrapper
          errorMessage={violationErrors[penalCode.id]?.fine}
          description={finesDisabled ? null : finesDescription}
        >
          <div className="flex items-center">
            <FormField className="mb-0" label={t("fines")} checkbox>
              <Checkbox
                disabled={finesDisabled}
                onChange={() => handleValueChange("fine", !currentValue.fine?.enabled)}
                checked={currentValue.fine?.enabled ?? false}
                name="fine.enabled"
                style={{ width: 20 }}
              />
            </FormField>
            <Input
              name="fine.value"
              onChange={handleValueChange.bind(null, "fine", undefined)}
              min={minFine}
              max={maxFine}
              type="number"
              disabled={isReadOnly || !currentValue.fine?.enabled}
              className="max-w-[125px] min-w-[125px] ml-5 py-0.5"
              value={!isNaN(currentValue.fine?.value) ? currentValue.fine?.value : ""}
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
            <FormField className="mb-0" label={t("jailTime")} checkbox>
              <Checkbox
                onChange={() => handleValueChange("jailTime", !currentValue.jailTime?.enabled)}
                checked={currentValue.jailTime?.enabled ?? false}
                name="jailTime.enabled"
                disabled={warningNotApplicableDisabled}
                style={{ width: 20 }}
              />
            </FormField>
            <Input
              name="jailTime.value"
              onChange={handleValueChange.bind(null, "jailTime", undefined)}
              min={minJailTime}
              max={maxJailTime}
              type="number"
              disabled={
                isReadOnly || warningNotApplicableDisabled || !currentValue.jailTime?.enabled
              }
              className="max-w-[125px] min-w-[125px] ml-5 py-0.5"
              value={!isNaN(currentValue.jailTime?.value) ? currentValue.jailTime?.value : ""}
            />
            {LEO_BAIL ? (
              <div className="flex flex-row items-center mb-0 ml-5">
                <label>{t("bail")}</label>
                <Input
                  type="number"
                  onChange={handleValueChange.bind(null, "bail", undefined)}
                  name="bail.value"
                  disabled={
                    isReadOnly ||
                    bailDisabled ||
                    warningNotApplicableDisabled ||
                    !currentValue.jailTime?.enabled
                  }
                  className="py-0.5 min-w-[125px] max-w-[125px] ml-5"
                  value={!isNaN(currentValue.bail?.value) ? currentValue.bail?.value : ""}
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
