import { LINK_INCIDENT_TO_CALL_SCHEMA } from "@snailycad/schemas";
import { Loader, Button } from "@snailycad/ui";
import { FormField } from "components/form/FormField";
import { Select, SelectValue } from "components/form/Select";
import { Modal } from "components/modal/Modal";
import { useModal } from "state/modalState";
import { Form, Formik } from "formik";
import { handleValidate } from "lib/handleValidate";
import useFetch from "lib/useFetch";
import { useTranslations } from "next-intl";
import type { Full911Call } from "state/dispatch/dispatch-state";
import { ModalIds } from "types/ModalIds";
import type { LeoIncident } from "@snailycad/types";
import type { PostLink911CallToIncident } from "@snailycad/types/api";

interface Props {
  call: Full911Call | null;
  onSave(call: Full911Call): void;
  incidents: LeoIncident[];
}

export function LinkCallToIncidentModal({ incidents, onSave, call }: Props) {
  const common = useTranslations("Common");
  const t = useTranslations("Leo");
  const { isOpen, closeModal } = useModal();
  const { state, execute } = useFetch();

  async function onSubmit(values: typeof INITIAL_VALUES) {
    if (!call) return;

    const { json } = await execute<PostLink911CallToIncident>({
      path: `/911-calls/link-incident/${call.id}`,
      method: "POST",
      data: { incidentIds: values.incidentIds.map((v) => v.value) },
    });

    if (json) {
      closeModal(ModalIds.LinkCallToIncident);
      onSave({ ...call, ...json });
    }
  }

  const validate = handleValidate(LINK_INCIDENT_TO_CALL_SCHEMA);
  const callIncidents = call?.incidents?.map((v) => ({ value: v.id, label: `#${v.caseNumber}` }));
  const INITIAL_VALUES = {
    incidentIds: (callIncidents ?? []) as SelectValue[],
  };

  return (
    <Modal
      title={t("linkToIncident")}
      isOpen={isOpen(ModalIds.LinkCallToIncident)}
      onClose={() => closeModal(ModalIds.LinkCallToIncident)}
      className="min-w-[600px]"
    >
      <Formik validate={validate} onSubmit={onSubmit} initialValues={INITIAL_VALUES}>
        {({ handleChange, errors, values }) => (
          <Form>
            <FormField errorMessage={errors.incidentIds as string} label={t("caseNumber")}>
              <Select
                closeMenuOnSelect={false}
                isMulti
                values={incidents.map((incident) => ({
                  value: incident.id,
                  label: `#${incident.caseNumber}`,
                }))}
                value={values.incidentIds}
                onChange={handleChange}
                name="incidentIds"
              />
            </FormField>

            <footer className="flex items-center justify-end gap-2 mt-5">
              <Button
                type="reset"
                onPress={() => closeModal(ModalIds.LinkCallToIncident)}
                variant="cancel"
              >
                {common("cancel")}
              </Button>
              <Button className="flex items-center" disabled={state === "loading"} type="submit">
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
