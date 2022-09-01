import { FormField } from "components/form/FormField";
import { Input } from "components/form/inputs/Input";
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

export function TableItemForm({ penalCode, isReadOnly }: Props) {
  const t = useTranslations("Leo");
  const { LEO_BAIL } = useFeatureEnabled();

  const minFinesArr = [
    penalCode.warningNotApplicable?.fines[0],
    penalCode.warningApplicable?.fines[0],
  ] as number[];
  const maxFinesArr = [
    penalCode.warningNotApplicable?.fines[1],
    penalCode.warningApplicable?.fines[1],
  ] as number[];

  const minFine = Math.min(...minFinesArr);
  const maxFine = Math.max(...maxFinesArr);

  const [minJailTime, maxJailTime] = penalCode.warningNotApplicable?.prisonTerm ?? [];
  const [minBail, maxBail] = penalCode.warningNotApplicable?.bail ?? [];

  const jailTimeDisabled = isReadOnly || !penalCode.warningNotApplicable?.prisonTerm;
  const warningNotApplicableDisabled =
    isReadOnly || !penalCode.warningNotApplicableId || jailTimeDisabled;
  const finesDisabled =
    isReadOnly || (!penalCode.warningNotApplicable?.fines && !penalCode.warningApplicable?.fines);

  const { setFieldValue, values, errors } = useFormikContext<any>();
  const violationErrors = (errors.violations ?? {}) as Record<
    string,
    { fine?: string; jailTime?: string; bail?: string }
  >;

  const current = values.violations.find(
    (v: SelectValue<PenalCode>) => v.value?.id === penalCode.id,
  );

  const currentValue = current?.value ?? {
    fine: { enabled: false, value: "" },
    jailTime: { enabled: false, value: "" },
    bail: { value: "" },
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

  return (
    <div className="flex flex-col">
      <FieldWrapper errorMessage={violationErrors[penalCode.id]?.fine}>
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
            disabled={isReadOnly || warningNotApplicableDisabled || !currentValue.jailTime?.enabled}
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
                  isReadOnly || warningNotApplicableDisabled || !currentValue.jailTime?.enabled
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
  );
}

function FieldWrapper({
  children,
  errorMessage,
}: {
  children: React.ReactNode;
  errorMessage?: string;
}) {
  return (
    <div className="flex flex-col mb-2">
      {children}

      {errorMessage ? <span className="mt-1 font-medium text-red-500">{errorMessage}</span> : null}
    </div>
  );
}
