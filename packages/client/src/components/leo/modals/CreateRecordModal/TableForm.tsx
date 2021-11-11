import { FormField } from "components/form/FormField";
import { Input } from "components/form/Input";
import { SelectValue } from "components/form/Select";
import { useFormikContext } from "formik";
import { PenalCode } from "types/prisma";

export const TableForm = ({ penalCode }: { penalCode: PenalCode }) => {
  const [minFine, maxFine] = penalCode.warningNotApplicable!.fines ?? [];
  const [minJailTime, maxJailTime] = penalCode.warningNotApplicable!.prisonTerm ?? [];

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

    updatedArr[idx] = {
      label: penalCode.title,
      value: {
        ...penalCode,
        [fieldName]: {
          enabled: enabled ?? (penalCode as any)[fieldName]?.enabled ?? true,
          value: e?.target?.valueAsNumber ?? (penalCode as any)[fieldName]?.value ?? "",
        },
      },
    };

    setFieldValue("violations", updatedArr);
  };

  return (
    <div className="flex flex-col">
      <div className="flex items-center">
        <FormField fieldId="fineBox" className="mb-0" label={"Fine"} checkbox>
          <Input
            id="fineBox"
            onChange={() => handleValueChange("fine", !currentValue.fine?.enabled ?? false)}
            checked={currentValue.fine?.enabled ?? false}
            name="fine.enabled"
            type="checkbox"
            className="min-w-[1em]"
          />
        </FormField>

        <Input
          name="fine.value"
          onChange={handleValueChange.bind(null, "fine", undefined)}
          min={minFine}
          max={maxFine}
          type="number"
          className="max-w-[100px] ml-5 py-0.5"
          disabled={!currentValue.fine?.enabled ?? true}
        />
      </div>

      <div className="flex items-center mt-1">
        <FormField fieldId="jailTime" className="mb-0" label={"Jail Time"} checkbox>
          <Input
            id="jailTime"
            onChange={() => handleValueChange("jailTime", !currentValue.jailTime?.enabled ?? false)}
            checked={currentValue.jailTime?.enabled ?? false}
            name="jailTime.enabled"
            type="checkbox"
            className="min-w-[1em]"
          />
        </FormField>

        <Input
          name="jailTime.value"
          onChange={handleValueChange.bind(null, "jailTime", undefined)}
          min={minJailTime}
          max={maxJailTime}
          type="number"
          className="max-w-[100px] ml-5 py-0.5"
          disabled={!currentValue.jailTime?.enabled ?? true}
        />

        <div className="flex flex-row items-center mb-0 ml-5">
          <label>Bail</label>
          <Input
            type="number"
            onChange={handleValueChange.bind(null, "bail", undefined)}
            name="bail.value"
            className="py-0.5 max-w-[100px] ml-5"
            disabled={!currentValue.jailTime?.enabled ?? true}
          />
        </div>
      </div>
    </div>
  );
};
