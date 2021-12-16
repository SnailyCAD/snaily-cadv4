import { LEO_INCIDENT_SCHEMA } from "@snailycad/schemas";
import { Button } from "components/Button";
import { Error } from "components/form/Error";
import { FormField } from "components/form/FormField";
import { Select } from "components/form/Select";
import { Loader } from "components/Loader";
import { Modal } from "components/modal/Modal";
import { useModal } from "context/ModalContext";
import { Form, Formik } from "formik";
import { handleValidate } from "lib/handleValidate";
import useFetch from "lib/useFetch";
import { ModalIds } from "types/ModalIds";
import { useTranslations } from "use-intl";
import { Textarea } from "components/form/Textarea";
import { useDispatchState } from "state/dispatchState";
import { makeUnitName } from "lib/utils";
import { useGenerateCallsign } from "hooks/useGenerateCallsign";
import { Toggle } from "components/form/Toggle";
import { FormRow } from "components/form/FormRow";
import { useLeoState } from "state/leoState";
import { useRouter } from "next/router";

export const CreateIncidentModal = () => {
  const { isOpen, closeModal } = useModal();
  const common = useTranslations("Common");
  const t = useTranslations("Leo");
  const generateCallsign = useGenerateCallsign();
  const { activeOfficer } = useLeoState();
  const router = useRouter();

  const { state, execute } = useFetch();
  const { allOfficers } = useDispatchState();

  async function onSubmit(values: typeof INITIAL_VALUES) {
    const { json } = await execute("/incidents", {
      method: "POST",
      data: values,
    });

    if (json.id) {
      closeModal(ModalIds.CreateIncident);
      router.replace({
        pathname: router.pathname,
        query: router.query,
      });
    }
  }

  const validate = handleValidate(LEO_INCIDENT_SCHEMA);
  const INITIAL_VALUES = {
    description: "",
    involvedOfficers: [],
    firearmsInvolved: false,
    injuriesOrFatalities: false,
    arrestsMade: false,
  };

  return (
    <Modal
      title={t("createIncident")}
      onClose={() => closeModal(ModalIds.CreateIncident)}
      isOpen={isOpen(ModalIds.CreateIncident)}
      className="w-[600px]"
    >
      <Formik validate={validate} initialValues={INITIAL_VALUES} onSubmit={onSubmit}>
        {({ handleChange, errors, values, isValid }) => (
          <Form>
            <FormField label={t("involvedOfficers")}>
              <Select
                value={values.involvedOfficers}
                hasError={!!errors.involvedOfficers}
                name="involvedOfficers"
                onChange={handleChange}
                values={allOfficers
                  .filter((v) => v.id !== activeOfficer?.id)
                  .map((v) => ({
                    label: `${generateCallsign(v)} ${makeUnitName(v)}`,
                    value: v.id,
                  }))}
              />
              <Error>{errors.involvedOfficers}</Error>
            </FormField>

            <FormRow>
              <FormField label={t("firearmsInvolved")}>
                <Toggle
                  toggled={values.firearmsInvolved}
                  name="firearmsInvolved"
                  onClick={handleChange}
                />
                <Error>{errors.firearmsInvolved}</Error>
              </FormField>

              <FormField label={t("injuriesOrFatalities")}>
                <Toggle
                  toggled={values.injuriesOrFatalities}
                  name="injuriesOrFatalities"
                  onClick={handleChange}
                />
                <Error>{errors.injuriesOrFatalities}</Error>
              </FormField>

              <FormField label={t("arrestsMade")}>
                <Toggle toggled={values.arrestsMade} name="arrestsMade" onClick={handleChange} />
                <Error>{errors.arrestsMade}</Error>
              </FormField>
            </FormRow>

            <FormField label={common("description")}>
              <Textarea
                value={values.description}
                hasError={!!errors.description}
                id="description"
                onChange={handleChange}
              />
              <Error>{errors.description}</Error>
            </FormField>

            <footer className="flex justify-end mt-5">
              <Button
                type="reset"
                onClick={() => closeModal(ModalIds.CreateIncident)}
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
                {common("create")}
              </Button>
            </footer>
          </Form>
        )}
      </Formik>
    </Modal>
  );
};
