import { LINK_INCIDENT_TO_CALL } from "@snailycad/schemas";
import { Button } from "components/Button";
import { FormField } from "components/form/FormField";
import { Select } from "components/form/Select";
import { Loader } from "components/Loader";
import { Modal } from "components/modal/Modal";
import { useModal } from "context/ModalContext";
import { Form, Formik } from "formik";
import { handleValidate } from "lib/handleValidate";
import useFetch from "lib/useFetch";
import { useTranslations } from "next-intl";
import { useRouter } from "next/router";
import type { Full911Call } from "state/dispatchState";
import { ModalIds } from "types/ModalIds";
import type { LeoIncident } from "@snailycad/types";

interface Props {
  call: Full911Call | null;
  incidents: LeoIncident[];
}

export function LinkCallToIncidentModal({ incidents, call }: Props) {
  const common = useTranslations("Common");
  const t = useTranslations("Leo");
  const { isOpen, closeModal } = useModal();
  const { state, execute } = useFetch();
  const router = useRouter();

  async function onSubmit(values: typeof INITIAL_VALUES) {
    if (!call) return;

    const { json } = await execute(`/911-calls/link-incident/${call.id}`, {
      method: "POST",
      data: values,
    });

    if (json) {
      closeModal(ModalIds.LinkCallToIncident);
      router.replace({ pathname: router.pathname, query: router.query });
    }
  }

  const validate = handleValidate(LINK_INCIDENT_TO_CALL);
  const INITIAL_VALUES = {
    incidentId: "",
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
            <FormField errorMessage={errors.incidentId} label={t("caseNumber")}>
              <Select
                values={incidents.map((incident) => ({
                  value: incident.id,
                  label: `#${incident.caseNumber}`,
                }))}
                value={values.incidentId}
                onChange={handleChange}
                name="incidentId"
              />
            </FormField>

            <footer className="flex items-center justify-end gap-2 mt-5">
              <Button
                type="reset"
                onClick={() => closeModal(ModalIds.LinkCallToIncident)}
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
