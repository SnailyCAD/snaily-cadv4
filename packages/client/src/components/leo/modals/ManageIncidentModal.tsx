import { LEO_INCIDENT_SCHEMA } from "@snailycad/schemas";
import { Button } from "components/Button";
import { FormField } from "components/form/FormField";
import { Select, SelectValue } from "components/form/Select";
import { Loader } from "components/Loader";
import { Modal } from "components/modal/Modal";
import { useModal } from "context/ModalContext";
import { Form, Formik } from "formik";
import { handleValidate } from "lib/handleValidate";
import useFetch from "lib/useFetch";
import { ModalIds } from "types/ModalIds";
import { useTranslations } from "use-intl";
import { useDispatchState } from "state/dispatchState";
import { makeUnitName } from "lib/utils";
import { useGenerateCallsign } from "hooks/useGenerateCallsign";
import { Toggle } from "components/form/Toggle";
import { FormRow } from "components/form/FormRow";
import { useLeoState } from "state/leoState";
import { useRouter } from "next/router";
import type { FullIncident } from "src/pages/officer/incidents";
import { dataToSlate, Editor } from "components/modal/DescriptionModal/Editor";

interface Props {
  incident?: FullIncident | null;
  onClose?(): void;
  onCreate?(incident: FullIncident): void;
  onUpdate?(oldIncident: FullIncident, incident: FullIncident): void;
}

export function ManageIncidentModal({ onClose, onCreate, onUpdate, incident }: Props) {
  const { isOpen, closeModal } = useModal();
  const common = useTranslations("Common");
  const t = useTranslations("Leo");
  const generateCallsign = useGenerateCallsign();
  const { activeOfficer } = useLeoState();
  const router = useRouter();
  const isDispatch = router.pathname.includes("/dispatch");
  const creator = isDispatch || !incident?.creator ? null : incident.creator;

  const { state, execute } = useFetch();
  const { allOfficers } = useDispatchState();

  function handleClose() {
    closeModal(ModalIds.ManageIncident);
    onClose?.();
  }

  async function onSubmit(values: typeof INITIAL_VALUES) {
    const data = {
      ...values,
      involvedOfficers: values.involvedOfficers.map((v) => v.value),
    };

    let id = "";

    if (incident) {
      const { json } = await execute(`/incidents/${incident.id}`, {
        method: "PUT",
        data,
      });

      id = json.id;
      onUpdate?.(incident, json);
    } else {
      const { json } = await execute("/incidents", {
        method: "POST",
        data,
      });

      id = json.id;
      onCreate?.(json);
    }

    if (id) {
      closeModal(ModalIds.ManageIncident);

      if (!isDispatch) {
        router.replace({
          pathname: router.pathname,
          query: router.query,
        });
      }
    }
  }

  const validate = handleValidate(LEO_INCIDENT_SCHEMA);
  const INITIAL_VALUES = {
    description: incident?.description ?? "",
    descriptionData: dataToSlate(incident),
    involvedOfficers:
      incident?.officersInvolved.map((v) => ({
        label: `${generateCallsign(v)} ${makeUnitName(v)}`,
        value: v.id,
      })) ?? ([] as SelectValue[]),
    firearmsInvolved: incident?.firearmsInvolved ?? false,
    injuriesOrFatalities: incident?.injuriesOrFatalities ?? false,
    arrestsMade: incident?.arrestsMade ?? false,
    isActive: isDispatch,
  };

  return (
    <Modal
      title={t("createIncident")}
      onClose={handleClose}
      isOpen={isOpen(ModalIds.ManageIncident)}
      className="w-[600px]"
    >
      <Formik validate={validate} initialValues={INITIAL_VALUES} onSubmit={onSubmit}>
        {({ handleChange, setFieldValue, errors, values, isValid }) => (
          <Form>
            <FormField
              errorMessage={errors.involvedOfficers as string}
              label={t("involvedOfficers")}
            >
              <Select
                isMulti
                value={values.involvedOfficers}
                name="involvedOfficers"
                onChange={handleChange}
                values={allOfficers
                  .filter((v) => (creator ? v.id !== activeOfficer?.id : true))
                  .map((v) => ({
                    label: `${generateCallsign(v)} ${makeUnitName(v)}`,
                    value: v.id,
                  }))}
              />
            </FormField>

            <FormRow>
              <FormField errorMessage={errors.firearmsInvolved} label={t("firearmsInvolved")}>
                <Toggle
                  toggled={values.firearmsInvolved}
                  name="firearmsInvolved"
                  onClick={handleChange}
                />
              </FormField>

              <FormField
                errorMessage={errors.injuriesOrFatalities}
                label={t("injuriesOrFatalities")}
              >
                <Toggle
                  toggled={values.injuriesOrFatalities}
                  name="injuriesOrFatalities"
                  onClick={handleChange}
                />
              </FormField>

              <FormField errorMessage={errors.arrestsMade} label={t("arrestsMade")}>
                <Toggle toggled={values.arrestsMade} name="arrestsMade" onClick={handleChange} />
              </FormField>
            </FormRow>

            <FormField errorMessage={errors.description} label={common("description")}>
              <Editor
                value={values.descriptionData}
                onChange={(v) => setFieldValue("descriptionData", v)}
              />
            </FormField>

            <footer className="flex justify-end mt-5">
              <Button type="reset" onClick={handleClose} variant="cancel">
                {common("cancel")}
              </Button>
              <Button
                className="flex items-center"
                disabled={!isValid || state === "loading"}
                type="submit"
              >
                {state === "loading" ? <Loader className="mr-2" /> : null}
                {incident ? common("save") : common("create")}
              </Button>
            </footer>
          </Form>
        )}
      </Formik>
    </Modal>
  );
}
