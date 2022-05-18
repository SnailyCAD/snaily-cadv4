import * as Accordion from "@radix-ui/react-accordion";
import { FormField } from "components/form/FormField";
import { FormRow } from "components/form/FormRow";
import { Input } from "components/form/inputs/Input";
import type { SelectValue } from "components/form/Select";
import { useFormikContext } from "formik";
import { CaretDownFill } from "react-bootstrap-icons";

export function AdvancedSettings() {
  const { values, handleChange, setFieldValue } = useFormikContext<{
    callsigns: { divisionId: string; callsign: string; callsign2: string }[];
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

  console.log({ callsigns: values.callsigns });

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

          {values.divisions.map((div, idx) => {
            return (
              <div className="flex flex-col gap-2" key={div.value}>
                <h3 className="text-lg font-semibold">{div.label}&apos;s Callsign</h3>

                <FormRow>
                  <FormField label={`Division callsign 1 (${div.label})`}>
                    <Input
                      onChange={(e) => _handleChange(e, div.value)}
                      value={values.callsigns[idx]?.callsign ?? ""}
                      name={`callsigns[${idx}].callsign`}
                    />
                  </FormField>

                  <FormField label={`Division callsign 2 (${div.label})`}>
                    <Input
                      onChange={(e) => _handleChange(e, div.value)}
                      value={values.callsigns[idx]?.callsign2 ?? ""}
                      name={`callsigns[${idx}].callsign2`}
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
