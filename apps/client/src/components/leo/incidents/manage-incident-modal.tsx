import { LEO_INCIDENT_SCHEMA } from "@snailycad/schemas";
import { Loader, Button, Input } from "@snailycad/ui";
import { FormField } from "components/form/FormField";
import { Modal } from "components/modal/Modal";
import { useModal } from "state/modalState";
import { Form, Formik } from "formik";
import { handleValidate } from "lib/handleValidate";
import useFetch from "lib/useFetch";
import { ModalIds } from "types/ModalIds";
import { useTranslations } from "use-intl";
import { Toggle } from "components/form/Toggle";
import { FormRow } from "components/form/FormRow";
import { useRouter } from "next/router";
import { dataToSlate, Editor } from "components/editor/editor";
import { IncidentEventsArea } from "./IncidentEventsArea";
import { classNames } from "lib/classNames";
import { useActiveIncidents } from "hooks/realtime/useActiveIncidents";
import { EmsFdIncident, LeoIncident, StatusValueType, ValueType } from "@snailycad/types";
import { useValues } from "context/ValuesContext";
import type { PostIncidentsData, PutIncidentByIdData } from "@snailycad/types/api";
import { AddressPostalSelect } from "components/form/select/PostalSelect";
import { InvolvedUnitsTable } from "./involved-units/involved-units-table";
import { ValueSelectField } from "components/form/inputs/value-select-field";

interface Props<T extends LeoIncident | EmsFdIncident> {
  incident?: T | null;
  onClose?(): void;
  onCreate?(incident: T & { openModalAfterCreation?: boolean }): void;
  onUpdate?(oldIncident: T, incident: T): void;
  type: "ems-fd" | "leo";
}

export function ManageIncidentModal<T extends LeoIncident | EmsFdIncident>({
  onClose,
  onCreate,
  onUpdate,
  incident: tempIncident,
  type,
}: Props<T>) {
  const { activeIncidents, setActiveIncidents } = useActiveIncidents();
  const foundIncident = activeIncidents.find((v) => v.id === tempIncident?.id);
  const incident = foundIncident ?? tempIncident ?? null;

  const { isOpen, closeModal } = useModal();
  const common = useTranslations("Common");
  const t = useTranslations("Leo");
  const { codes10 } = useValues();
  const router = useRouter();
  const { state, execute } = useFetch();

  const isDispatch = router.pathname.includes("/dispatch");
  const isEmsFdIncidents = type === "ems-fd" || router.pathname === "/ems-fd/incidents";
  const isLeoIncidents = type === "leo" || router.pathname === "/officer/incidents";
  const areIncidentsNonDispatch = isEmsFdIncidents || isLeoIncidents;

  const areEventsReadonly = !isDispatch || areIncidentsNonDispatch;
  const areFieldsDisabled = !isDispatch && !areIncidentsNonDispatch;

  function handleAddUpdateCallEvent(incident: LeoIncident) {
    setActiveIncidents(activeIncidents.map((inc) => (inc.id === incident.id ? incident : inc)));
  }

  function handleClose() {
    closeModal(ModalIds.ManageIncident);
    onClose?.();
  }

  async function onSubmit(values: typeof INITIAL_VALUES) {
    let id = "";

    if (incident) {
      const { json, error } = await execute<
        PutIncidentByIdData<T extends EmsFdIncident ? "ems-fd" : "leo">
      >({
        path: isLeoIncidents ? `/incidents/${incident.id}` : `/ems-fd/incidents/${incident.id}`,
        method: "PUT",
        data: values,
      });

      if (json && !error) {
        id = json.id;
        onUpdate?.(incident as T, json as T);
      }
    } else {
      const { json, error } = await execute<
        PostIncidentsData<T extends EmsFdIncident ? "ems-fd" : "leo">
      >({
        path: isLeoIncidents ? "/incidents" : "/ems-fd/incidents",
        method: "POST",
        data: values,
      });

      if (json && !error) {
        id = json.id;
        onCreate?.({ ...(json as T), openModalAfterCreation: values.openModalAfterCreation });
      }
    }

    if (id && values.openModalAfterCreation && isDispatch) {
      closeModal(ModalIds.ManageIncident);
    } else if (id) {
      closeModal(ModalIds.ManageIncident);
    }
  }

  const validate = handleValidate(LEO_INCIDENT_SCHEMA);
  const INITIAL_VALUES = {
    description: incident?.description ?? "",
    postal: incident?.postal ?? "",
    descriptionData: dataToSlate(incident),
    firearmsInvolved: incident?.firearmsInvolved ?? false,
    injuriesOrFatalities: incident?.injuriesOrFatalities ?? false,
    arrestsMade: incident?.arrestsMade ?? false,
    isActive: isDispatch ? true : incident?.isActive ?? false,
    situationCodeId: incident?.situationCodeId ?? null,
    openModalAfterCreation: true,
  };

  return (
    <Modal
      title={incident ? t("manageIncident") : t("createIncident")}
      onClose={handleClose}
      isOpen={isOpen(ModalIds.ManageIncident)}
      className={incident ? "w-[1200px] " : "w-[750px]"}
    >
      <div className={classNames(incident && "flex flex-col md:flex-row min-h-[450px] gap-3")}>
        <Formik
          enableReinitialize
          validate={validate}
          initialValues={INITIAL_VALUES}
          onSubmit={onSubmit}
        >
          {({ handleChange, setFieldValue, errors, values, isValid }) => (
            <Form className="w-full flex flex-col justify-between">
              <div>
                <FormRow>
                  <FormField errorMessage={errors.firearmsInvolved} label={t("firearmsInvolved")}>
                    <Toggle
                      disabled={areFieldsDisabled}
                      value={values.firearmsInvolved}
                      name="firearmsInvolved"
                      onCheckedChange={handleChange}
                    />
                  </FormField>
                  <FormField
                    errorMessage={errors.injuriesOrFatalities}
                    label={t("injuriesOrFatalities")}
                  >
                    <Toggle
                      disabled={areFieldsDisabled}
                      value={values.injuriesOrFatalities}
                      name="injuriesOrFatalities"
                      onCheckedChange={handleChange}
                    />
                  </FormField>
                  <FormField errorMessage={errors.arrestsMade} label={t("arrestsMade")}>
                    <Toggle
                      disabled={areFieldsDisabled}
                      value={values.arrestsMade}
                      name="arrestsMade"
                      onCheckedChange={handleChange}
                    />
                  </FormField>
                </FormRow>

                <FormField errorMessage={errors.description} label={common("description")}>
                  <Editor
                    isReadonly={areFieldsDisabled}
                    value={values.descriptionData}
                    onChange={(v) => setFieldValue("descriptionData", v)}
                  />
                </FormField>

                <FormRow flexLike>
                  <ValueSelectField
                    className="w-full"
                    isOptional
                    isDisabled={areFieldsDisabled}
                    isClearable
                    label={t("situationCode")}
                    fieldName="situationCodeId"
                    values={codes10.values}
                    valueType={ValueType.CODES_10}
                    filterFn={(value) => value.type === StatusValueType.SITUATION_CODE}
                  />

                  <AddressPostalSelect postalOnly addressLabel="location" />
                </FormRow>

                {incident ? (
                  <InvolvedUnitsTable
                    type={type}
                    isDisabled={areFieldsDisabled}
                    incident={incident}
                  />
                ) : null}
              </div>

              <footer className="flex items-center justify-end mt-5">
                {isDispatch && !incident ? (
                  <FormField
                    className="!mb-0 mr-2"
                    labelClassName="min-w-fit"
                    label="Open Manage incident modal after call creation?"
                    checkbox
                  >
                    <Input
                      checked={values.openModalAfterCreation}
                      onChange={() =>
                        setFieldValue("openModalAfterCreation", !values.openModalAfterCreation)
                      }
                      type="checkbox"
                    />
                  </FormField>
                ) : null}

                <Button type="reset" onPress={handleClose} variant="cancel">
                  {common("cancel")}
                </Button>
                <Button
                  className="flex items-center"
                  disabled={areFieldsDisabled || !isValid || state === "loading"}
                  type="submit"
                >
                  {state === "loading" ? <Loader className="mr-2" /> : null}
                  {incident ? common("save") : common("create")}
                </Button>
              </footer>
            </Form>
          )}
        </Formik>

        {incident ? (
          <IncidentEventsArea
            handleStateUpdate={handleAddUpdateCallEvent}
            disabled={areEventsReadonly}
            incident={incident}
          />
        ) : null}
      </div>
    </Modal>
  );
}
