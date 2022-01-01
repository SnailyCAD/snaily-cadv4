import { FormField } from "components/form/FormField";
import { Input } from "components/form/Input";
import { SelectValue } from "components/form/Select";
import { useFormikContext } from "formik";
import { useTranslations } from "next-intl";
import { PenalCode } from "types/prisma";

interface Props {
  penalCode: PenalCode;
}

export function TableItemForm({ penalCode }: Props) {
  const t = useTranslations("Leo");
  const [minFine, maxFine] =
    penalCode.warningNotApplicable?.fines ?? penalCode.warningApplicable?.fines ?? [];
  const [minJailTime, maxJailTime] = penalCode.warningNotApplicable?.prisonTerm ?? [];
  const [minBail, maxBail] = penalCode.warningNotApplicable?.bail ?? [];

  const warningApplicableDisabled = !penalCode.warningApplicableId;
  const warningNotApplicableDisabled = !penalCode.warningNotApplicableId;

  const { setFieldValue, values } = useFormikContext<any>();

  const currentValue = (values.violations as SelectValue<any>[]).find(
    (v) => v.value.id === penalCode.id,
  )?.value ?? {
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
      (v) => v.value.id === penalCode.id,
    );

    const updatedArr = [...values.violations] as SelectValue<PenalCode>[];

    const newValue = e?.target?.valueAsNumber ?? (penalCode as any)[fieldName]?.value ?? "";

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
      <div className="flex items-center">
        <FormField className="mb-0" label={t("fines")} checkbox>
          <Input
            disabled={warningApplicableDisabled}
            onChange={() => handleValueChange("fine", !currentValue.fine?.enabled ?? false)}
            checked={currentValue.fine?.enabled ?? false}
            name="fine.enabled"
            type="checkbox"
            style={{ width: 20 }}
          />
        </FormField>

        <Input
          name="fine.value"
          onChange={handleValueChange.bind(null, "fine", undefined)}
          min={minFine}
          max={maxFine}
          type="number"
          className="max-w-[125px] ml-5 py-0.5"
          disabled={warningApplicableDisabled || (!currentValue.fine?.enabled ?? true)}
        />
      </div>

      <div className="flex items-center mt-1">
        <FormField className="mb-0" label={t("jailTime")} checkbox>
          <Input
            onChange={() => handleValueChange("jailTime", !currentValue.jailTime?.enabled ?? false)}
            checked={currentValue.jailTime?.enabled ?? false}
            name="jailTime.enabled"
            type="checkbox"
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
          className="max-w-[125px] ml-5 py-0.5"
          disabled={warningNotApplicableDisabled || (!currentValue.jailTime?.enabled ?? true)}
        />

        <div className="flex flex-row items-center mb-0 ml-5">
          <label>{t("bail")}</label>
          <Input
            type="number"
            onChange={handleValueChange.bind(null, "bail", undefined)}
            name="bail.value"
            className="py-0.5 max-w-[125px] ml-5"
            disabled={warningNotApplicableDisabled || (!currentValue.jailTime?.enabled ?? true)}
            min={minBail}
            max={maxBail}
          />
        </div>
      </div>
    </div>
  );
}
