import * as Accordion from "@radix-ui/react-accordion";
import type { IndividualDivisionCallsign } from "@snailycad/types";
import { FormField } from "components/form/FormField";
import { FormRow } from "components/form/FormRow";
import { Input } from "@snailycad/ui";
import type { SelectValue } from "components/form/Select";
import { useFormikContext } from "formik";
import { CaretDownFill } from "react-bootstrap-icons";

export function AdvancedSettings() {
  const { values, handleChange, setFieldValue } = useFormikContext<{
    callsigns: Record<string, IndividualDivisionCallsign>;
    divisions: SelectValue<string>[];
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
    <Accordion.Root className="mt-5" collapsible type="single">
      <Accordion.Item value="advanced">
        <Accordion.Trigger
          title="Click to expand"
          className="accordion-state flex justify-between w-full pt-1 text-xl font-semibold text-left"
        >
          Advanced Settings
          <CaretDownFill
            width={20}
            height={20}
            className="transform w-5 h-5 transition-transform accordion-state-transform"
          />
        </Accordion.Trigger>

        <Accordion.Content className="mt-3">
          <p className="my-2 text-neutral-700 dark:text-gray-400">
            Set individual callsigns for each division. This is optional.
          </p>

          {values.divisions.map((div) => {
            return (
              <div className="flex flex-col gap-2" key={div.value}>
                <h3 className="text-lg font-semibold">{div.label}&apos;s Callsign</h3>

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
        </Accordion.Content>
      </Accordion.Item>
    </Accordion.Root>
  );
}
