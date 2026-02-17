import { EMS_FD_INCIDENT_SCHEMA, LEO_INCIDENT_SCHEMA } from "@snailycad/schemas";
import {
  Loader,
  Button,
  SwitchField,
  CheckboxField,
  FormRow,
  Infofield,
  FullDate,
  TextField,
} from "@snailycad/ui";
import { FormField } from "components/form/FormField";
import { Modal } from "components/modal/Modal";
import { useModal } from "state/modalState";
import { Form, Formik } from "formik";
import { handleValidate } from "lib/handleValidate";
import useFetch from "lib/useFetch";
import { ModalIds } from "types/modal-ids";
import { useTranslations } from "use-intl";
import { useRouter } from "next/router";
import { dataToSlate, Editor } from "components/editor/editor";
import { IncidentEventsArea } from "./IncidentEventsArea";
import { classNames } from "lib/classNames";
import { useActiveIncidents } from "hooks/realtime/useActiveIncidents";
import { type EmsFdIncident, type LeoIncident, StatusValueType, ValueType } from "@snailycad/types";
import { useValues } from "context/ValuesContext";
import type { PostIncidentsData, PutIncidentByIdData } from "@snailycad/types/api";
import { AddressPostalSelect } from "components/form/select/PostalSelect";
import { InvolvedUnitsTable } from "./involved-units/involved-units-table";
import { ValueSelectField } from "components/form/inputs/value-select-field";
import { useAuth } from "context/AuthContext";
import { useActiveDispatchers } from "hooks/realtime/use-active-dispatchers";
import { type ActiveOfficer, useLeoState } from "state/leo-state";
import { type ActiveDeputy, useEmsFdState } from "state/ems-fd-state";

interface Props<T extends LeoIncident | EmsFdIncident> {
  incident?: T | null;
  onClose?(): void;
  onCreate?(incident: T & { openModalAfterCreation?: boolean }): void;
  onUpdate?(oldIncident: T, incident: T): void;
  type: "ems-fd" | "leo";
}

interface AreFormFieldsDisabledOptions {
  isActiveIncidentsList: boolean;
  isDispatch: boolean;
  incident: LeoIncident | EmsFdIncident | null;

  hasActiveDispatchers: boolean;
  activeUnit: ActiveOfficer | ActiveDeputy | null;
}

function areFormFieldsDisabled(options: AreFormFieldsDisabledOptions) {
  /** non-active incidents are always editable */
  if (!options.isActiveIncidentsList) return false;
  /** dispatch can always edit the fields */
  if (options.isDispatch) return false;
  /** a new incident is being created, always editable */
  if (!options.incident) return false;

  /** if there are no active dispatchers, but the unit is assigned to the incident, it's editable */
  if (!options.hasActiveDispatchers) {
    const isAssignedToIncident = options.incident.unitsInvolved.some(
      (u) => u.unit?.id === options.activeUnit?.id,
    );
    return isAssignedToIncident;
  }

  // todo: make this an optional feature
  /** otherwise fields are not editable, even when the unit is assigned to the incident */
  return true;
}

export function ManageIncidentModal<T extends LeoIncident | EmsFdIncident>({
  onClose,
  onCreate,
  onUpdate,
  incident: tempIncident,
  type,
}: Props<T>) {
  const modalState = useModal();

  const { activeIncidents, setActiveIncidents } = useActiveIncidents();
  const payloadIncident = modalState.getPayload<LeoIncident | null>(ModalIds.ManageIncident);
  const foundIncident = activeIncidents.find((v) => v.id === tempIncident?.id);
  const incident = payloadIncident ?? foundIncident ?? tempIncident ?? null;

  const t = useTranslations("Leo");
  const common = useTranslations("Common");
  const router = useRouter();
  const activeOfficer = useLeoState((state) => state.activeOfficer);
  const activeDeputy = useEmsFdState((state) => state.activeDeputy);

  const { codes10 } = useValues();
  const { state, execute } = useFetch();
  const { user } = useAuth();
  const { hasActiveDispatchers } = useActiveDispatchers();

  const isDispatch = router.pathname.includes("/dispatch");
  const isLeoIncidents = type === "leo";

  const isEmsFdIncidentsPage = router.pathname === "/ems-fd/incidents";
  const isOfficerIncidentsPage = router.pathname === "/officer/incidents";

  const activeUnit = isOfficerIncidentsPage
    ? activeOfficer
    : isEmsFdIncidentsPage
      ? activeDeputy
      : null;
  const isReadOnly = isOfficerIncidentsPage || isEmsFdIncidentsPage;

  const areFieldsDisabled = areFormFieldsDisabled({
    isActiveIncidentsList: !isReadOnly,
    isDispatch,
    hasActiveDispatchers,
    incident,
    activeUnit,
  });

  function handleAddUpdateCallEvent(incident: LeoIncident) {
    setActiveIncidents(activeIncidents.map((inc) => (inc.id === incident.id ? incident : inc)));
  }

  function handleClose() {
    modalState.closeModal(ModalIds.ManageIncident);
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
      modalState.openModal(ModalIds.ManageIncident);
    } else if (id) {
      handleClose();
    }
  }

  const validate = handleValidate(type === "ems-fd" ? EMS_FD_INCIDENT_SCHEMA : LEO_INCIDENT_SCHEMA);
  const isEmsFdIncident = incident && "fireType" in incident;

  const INITIAL_VALUES = {
    description: incident?.description ?? "",
    postal: incident?.postal ?? "",
    address: isEmsFdIncident ? incident.address : "",
    descriptionData: dataToSlate(incident),
    vehicleInvolved: isEmsFdIncident ? incident.vehicleInvolved : false,
    firearmsInvolved: incident?.firearmsInvolved ?? false,
    injuriesOrFatalities: incident?.injuriesOrFatalities ?? false,
    arrestsMade: incident?.arrestsMade ?? false,
    isActive: isDispatch ? true : (incident?.isActive ?? false),
    situationCodeId: incident?.situationCodeId ?? null,
    openModalAfterCreation: true,
    fireType: isEmsFdIncident ? (incident.fireType ?? "") : "",
  };

  return (
    <Modal
      title={incident ? t("manageIncident") : t("createIncident")}
      onClose={handleClose}
      isOpen={modalState.isOpen(ModalIds.ManageIncident)}
      className={incident ? "w-[1200px] " : "w-[750px]"}
    >
      <div className={classNames(incident && "flex flex-col md:flex-row min-h-[450px] gap-3")}>
        <Formik
          enableReinitialize
          validate={validate}
          initialValues={INITIAL_VALUES}
          onSubmit={onSubmit}
        >
          {({ setFieldValue, errors, values, isValid }) => (
            <Form className="w-full flex flex-col justify-between">
              {incident ? (
                <header className="mb-4 flex flex-wrap flex-row max-w-[1050px]">
                  <Infofield className="mr-4" label={t("incident")}>
                    #{incident.caseNumber}
                  </Infofield>
                  <Infofield className="mr-4" label={t("lastUpdatedAt")}>
                    <FullDate>{incident.updatedAt}</FullDate>
                  </Infofield>
                  {user?.developerMode ? (
                    <Infofield className="mt-2" label={t("id")}>
                      {incident.id}
                    </Infofield>
                  ) : null}
                </header>
              ) : null}

              <div>
                <div
                  className={classNames(
                    "grid mb-3",
                    type === "ems-fd" ? "grid-cols-2" : "grid-cols-3",
                  )}
                >
                  <SwitchField
                    isDisabled={areFieldsDisabled}
                    isSelected={values.firearmsInvolved}
                    onChange={(isSelected) => setFieldValue("firearmsInvolved", isSelected)}
                    className="w-full"
                  >
                    {t("firearmsInvolved")}
                  </SwitchField>

                  <SwitchField
                    isDisabled={areFieldsDisabled}
                    isSelected={values.injuriesOrFatalities}
                    onChange={(isSelected) => setFieldValue("injuriesOrFatalities", isSelected)}
                    className="w-full"
                  >
                    {t("injuriesOrFatalities")}
                  </SwitchField>

                  <SwitchField
                    isDisabled={areFieldsDisabled}
                    isSelected={values.arrestsMade}
                    onChange={(isSelected) => setFieldValue("arrestsMade", isSelected)}
                    className="w-full"
                  >
                    {t("arrestsMade")}
                  </SwitchField>

                  {type === "ems-fd" ? (
                    <SwitchField
                      isDisabled={areFieldsDisabled}
                      isSelected={values.vehicleInvolved}
                      onChange={(isSelected) => setFieldValue("vehicleInvolved", isSelected)}
                      className="w-full"
                    >
                      {t("vehicleInvolved")}
                    </SwitchField>
                  ) : null}
                </div>

                <FormField errorMessage={errors.description} label={common("description")}>
                  <Editor
                    isReadonly={areFieldsDisabled}
                    value={values.descriptionData}
                    onChange={(v) => setFieldValue("descriptionData", v)}
                  />
                </FormField>

                <FormRow useFlex className={classNames(type === "ems-fd" && "!flex-col")}>
                  <FormRow useFlex className={classNames(type === "leo" && "!flex-col")}>
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

                    {type === "ems-fd" ? (
                      <TextField
                        isOptional
                        value={values.fireType}
                        className="w-full"
                        onChange={(value) => setFieldValue("fireType", value)}
                        label={t("fireType")}
                      />
                    ) : null}
                  </FormRow>

                  <AddressPostalSelect
                    addressOptional
                    isDisabled={areFieldsDisabled}
                    postalOnly={type === "leo"}
                    addressLabel="address"
                  />
                </FormRow>

                {incident ? (
                  <InvolvedUnitsTable
                    type={type}
                    isDisabled={isReadOnly || areFieldsDisabled}
                    incident={incident}
                  />
                ) : null}
              </div>

              <footer className="flex items-center justify-end mt-5">
                {isDispatch && !incident ? (
                  <CheckboxField
                    className="mb-0 mr-2"
                    isSelected={values.openModalAfterCreation}
                    onChange={(isSelected) => setFieldValue("openModalAfterCreation", isSelected)}
                  >
                    {t("openModalAfterCreation")}
                  </CheckboxField>
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
            disabled={isReadOnly || areFieldsDisabled}
            incident={incident}
          />
        ) : null}
      </div>
    </Modal>
  );
}
