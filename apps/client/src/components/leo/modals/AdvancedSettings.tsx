import type { IndividualDivisionCallsign } from "@snailycad/types";
import { FormField } from "components/form/FormField";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  Input,
  FormRow,
} from "@snailycad/ui";
import type { SelectValue } from "components/form/Select";
import { useFormikContext } from "formik";

export function AdvancedSettings() {
  const { values, handleChange, setFieldValue } = useFormikContext<{
    callsigns: Record<string, IndividualDivisionCallsign>;
    divisions: SelectValue[];
  }>();

  function _handleChange(e: React.ChangeEvent<HTMLInputElement>, divisionId: string) {
    handleChange(e);
    const name = e.target.name
      .replace(".callsign2", ".divisionId")
      .replace(".callsign", ".divisionId");

    setFieldValue(name, divisionId);
  }

  if (values.divisions.length <= 0) {
    return null;
  }

  return (
    <Accordion className="mt-5" collapsible type="single">
      <AccordionItem value="advanced">
        <AccordionTrigger title="Click to expand">Advanced Settings</AccordionTrigger>

        <AccordionContent className="mt-3">
          <p className="my-2 text-neutral-700 dark:text-gray-400">
            Set individual callsigns for each division. This is optional.
          </p>

          {values.divisions.map((div) => {
            return (
              <div className="flex flex-col gap-2" key={div.value}>
                <h3 className="font-semibold">{div.label}&apos;s Callsign</h3>

                <FormRow>
                  <FormField label={`Callsign 1 (${div.label})`}>
                    <Input
                      onChange={(e) => _handleChange(e, div.value)}
                      value={values.callsigns[div.value]?.callsign ?? ""}
                      name={`callsigns[${div.value}].callsign`}
                    />
                  </FormField>

                  <FormField label={`Callsign 2 (${div.label})`}>
                    <Input
                      onChange={(e) => _handleChange(e, div.value)}
                      value={values.callsigns[div.value]?.callsign2 ?? ""}
                      name={`callsigns[${div.value}].callsign2`}
                    />
                  </FormField>
                </FormRow>
              </div>
            );
          })}
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
