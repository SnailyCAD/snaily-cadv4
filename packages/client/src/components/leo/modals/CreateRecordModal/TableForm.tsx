import { FormField } from "components/form/FormField";
import { Input } from "components/form/Input";
import { SelectValue } from "components/form/Select";
import { useFormikContext } from "formik";
import { PenalCode } from "types/prisma";

export const TableForm = ({ penalCode }: { penalCode: PenalCode }) => {
  const [minFine, maxFine] = penalCode.warningNotApplicable!.fines ?? [];
  const [minJailTime, maxJailTime] = penalCode.warningNotApplicable!.prisonTerm ?? [];

  const { setFieldValue, values } = useFormikContext<any>();

  const handleValueChange = (fieldName: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const idx = (values.violations as SelectValue<PenalCode>[]).findIndex(
      (v) => v.value.id === penalCode.id,
    );

    const updatedArr = [...values.violations] as SelectValue<PenalCode>[];

    updatedArr[idx] = {
      label: penalCode.title,
      value: { ...penalCode, [fieldName]: e.target.valueAsNumber },
    };

    setFieldValue("violations", updatedArr);
  };

  return (
    <div className="flex flex-col">
      <div className="flex items-center">
        <FormField className="mb-0" label={"Fine"} checkbox>
          <Input
            onChange={() => setFieldValue("fine.enabled", !values.fine.enabled)}
            checked={values.fine.enabled}
            name="fine.enabled"
            type="checkbox"
            className="min-w-[1em]"
          />
        </FormField>

        <Input
          name="fine.value"
          onChange={handleValueChange.bind(null, "fine")}
          min={minFine}
          max={maxFine}
          type="number"
          className="max-w-[100px] ml-5 py-0.5"
        />
      </div>

      <div className="flex items-center mt-1">
        <FormField className="mb-0" label={"Jail Time"} checkbox>
          <Input
            onChange={() => setFieldValue("jailTime.enabled", !values.jailTime.enabled)}
            checked={values.jailTime.enabled}
            name="jailTime.enabled"
            type="checkbox"
            className="min-w-[1em]"
          />
        </FormField>

        <Input
          name="jailTime.value"
          onChange={handleValueChange.bind(null, "jailTime")}
          min={minJailTime}
          max={maxJailTime}
          type="number"
          className="max-w-[100px] ml-5 py-0.5"
          value={values.jailTime.value}
        />

        <div className="flex flex-row items-center mb-0 ml-5">
          <label>Bail</label>
          <Input
            type="number"
            onChange={handleValueChange.bind(null, "bail")}
            value={values.bail.value}
            name="bail.value"
            className="py-0.5 max-w-[100px] ml-5"
          />
        </div>
      </div>
    </div>
  );
};
