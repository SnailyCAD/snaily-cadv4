import { FormField } from "components/form/FormField";
import { Input } from "components/form/Input";
import { Formik } from "formik";
import { PenalCode } from "types/prisma";

export const TableForm = ({ penalCode }: { penalCode: PenalCode }) => {
  const [minFine, maxFine] = penalCode.warningNotApplicable!.fines ?? [];
  const [minJailTime, maxJailTime] = penalCode.warningNotApplicable!.prisonTerm ?? [];

  const initialValues = {
    fine: { enabled: false, value: "" },
    jailTime: { enabled: false, value: "" },
    bail: { value: "" },
  };

  async function onSubmit(values: typeof initialValues) {
    console.log({ values });
  }

  return (
    // todo: make this not a form.
    // send this data together with CreateRecord
    <Formik onSubmit={onSubmit} initialValues={initialValues}>
      {({ handleChange, handleSubmit, setFieldValue, values }) => (
        <form onSubmit={handleSubmit}>
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
                onChange={handleChange}
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
                onChange={handleChange}
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
                  onChange={handleChange}
                  value={values.bail.value}
                  name="bail.value"
                  className="py-0.5 max-w-[100px] ml-5"
                />
              </div>
            </div>
          </div>
        </form>
      )}
    </Formik>
  );
};
