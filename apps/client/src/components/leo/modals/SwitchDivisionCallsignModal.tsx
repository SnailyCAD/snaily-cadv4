import { SWITCH_CALLSIGN_SCHEMA } from "@snailycad/schemas";
import { Loader, Button } from "@snailycad/ui";
import { FormField } from "components/form/FormField";
import { Select } from "components/form/Select";
import { Modal } from "components/modal/Modal";
import { useModal } from "state/modalState";
import { Form, Formik } from "formik";
import { handleValidate } from "lib/handleValidate";
import useFetch from "lib/useFetch";
import { ModalIds } from "types/ModalIds";
import { useTranslations } from "use-intl";
import { useLeoState } from "state/leo-state";
import { useGenerateCallsign } from "hooks/useGenerateCallsign";
import { isUnitCombined } from "@snailycad/utils";
import type { PutLeoCallsignData } from "@snailycad/types/api";
import { shallow } from "zustand/shallow";

export function SwitchDivisionCallsignModal() {
  const { activeOfficer, setActiveOfficer } = useLeoState(
    (state) => ({
      activeOfficer: state.activeOfficer,
      setActiveOfficer: state.setActiveOfficer,
    }),
    shallow,
  );
  const { isOpen, closeModal } = useModal();
  const common = useTranslations("Common");
  const t = useTranslations("Leo");
  const { generateCallsign } = useGenerateCallsign();

  const { state, execute } = useFetch();

  async function onSubmit(values: typeof INITIAL_VALUES) {
    if (!activeOfficer) return;

    const { json } = await execute<PutLeoCallsignData>({
      path: `/leo/callsign/${activeOfficer?.id}`,
      method: "PUT",
      data: values,
    });

    if (json.id) {
      closeModal(ModalIds.SwitchDivisionCallsign);
      setActiveOfficer(json);
    }
  }

  if (!activeOfficer || isUnitCombined(activeOfficer)) {
    return null;
  }

  const validate = handleValidate(SWITCH_CALLSIGN_SCHEMA);
  const callsigns = [
    { id: "null", callsign: activeOfficer.callsign, callsign2: activeOfficer.callsign2 },
    ...(activeOfficer.callsigns ?? []),
  ];
  const INITIAL_VALUES = {
    callsign: "",
  };

  if (!callsigns.length) {
    return null;
  }

  return (
    <Modal
      title={t("switchDivisionCallsign")}
      onClose={() => closeModal(ModalIds.SwitchDivisionCallsign)}
      isOpen={isOpen(ModalIds.SwitchDivisionCallsign)}
      className="w-[600px]"
    >
      <Formik validate={validate} initialValues={INITIAL_VALUES} onSubmit={onSubmit}>
        {({ handleChange, errors, values, isValid }) => (
          <Form>
            <FormField errorMessage={errors.callsign} label={t("callsign")}>
              <Select
                value={values.callsign}
                name="callsign"
                onChange={handleChange}
                isClearable
                values={callsigns.map((callsign) => ({
                  // @ts-expect-error ignore
                  label: generateCallsign({
                    citizenId: activeOfficer.citizenId,
                    divisions: activeOfficer.divisions,
                    ...callsign,
                  }),
                  value: callsign.id,
                }))}
              />
            </FormField>

            <footer className="flex justify-end mt-5">
              <Button
                type="reset"
                onPress={() => closeModal(ModalIds.SwitchDivisionCallsign)}
                variant="cancel"
              >
                {common("cancel")}
              </Button>
              <Button
                className="flex items-center"
                disabled={!isValid || state === "loading"}
                type="submit"
              >
                {state === "loading" ? <Loader className="mr-2" /> : null}
                {common("save")}
              </Button>
            </footer>
          </Form>
        )}
      </Formik>
    </Modal>
  );
}
