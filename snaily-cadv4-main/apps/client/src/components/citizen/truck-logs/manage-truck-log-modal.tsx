import { CREATE_TRUCK_LOG_SCHEMA } from "@snailycad/schemas";
import { FormRow, Loader, Button, TextField, AsyncListSearchField, Item } from "@snailycad/ui";
import { Modal } from "components/modal/Modal";
import { useModal } from "state/modalState";
import { Form, Formik } from "formik";
import { handleValidate } from "lib/handleValidate";
import useFetch from "lib/useFetch";
import { ModalIds } from "types/modal-ids";
import { useTranslations } from "use-intl";
import { CitizenSuggestionsField } from "components/shared/CitizenSuggestionsField";
import type { GetTruckLogsData, PostTruckLogsData, PutTruckLogsData } from "@snailycad/types/api";
import type { RegisteredVehicle } from "@snailycad/types";

interface Props {
  log: GetTruckLogsData["logs"][number] | null;
  onUpdate?(old: GetTruckLogsData["logs"][number], newLog: GetTruckLogsData["logs"][number]): void;
  onCreate?(log: GetTruckLogsData["logs"][number]): void;
  onClose?(): void;
}

export function ManageTruckLogModal({ onUpdate, onCreate, onClose, log }: Props) {
  const common = useTranslations("Common");
  const t = useTranslations("TruckLogs");
  const modalState = useModal();
  const { state, execute } = useFetch();

  function handleClose() {
    onClose?.();
    modalState.closeModal(ModalIds.ManageTruckLog);
  }

  async function onSubmit(values: typeof INITIAL_VALUES) {
    if (log) {
      const { json } = await execute<PutTruckLogsData>({
        path: `/truck-logs/${log.id}`,
        method: "PUT",
        data: values,
      });

      if (json.id) {
        onUpdate?.(log, json);
        modalState.closeModal(ModalIds.ManageTruckLog);
      }
    } else {
      const { json } = await execute<PostTruckLogsData>({
        path: "/truck-logs",
        method: "POST",
        data: values,
      });

      if (json.id) {
        onCreate?.(json);
        modalState.closeModal(ModalIds.ManageTruckLog);
      }
    }
  }

  const INITIAL_VALUES = {
    endedAt: log?.endedAt ?? "",
    startedAt: log?.startedAt ?? "",
    vehicleId: log?.vehicleId ?? "",
    vehicleName: log?.vehicle?.model.value.value ?? "",
    citizenId: log?.citizenId ?? "",
    citizenName: log?.citizen ? `${log.citizen.name} ${log.citizen.surname}` : "",
    notes: log?.notes ?? "",
  };

  const validate = handleValidate(CREATE_TRUCK_LOG_SCHEMA);

  return (
    <Modal
      onClose={handleClose}
      title={log ? t("editTruckLog") : t("createTruckLog")}
      isOpen={modalState.isOpen(ModalIds.ManageTruckLog)}
      className="w-[700px]"
    >
      <Formik validate={validate} initialValues={INITIAL_VALUES} onSubmit={onSubmit}>
        {({ setFieldValue, values, isValid, errors }) => (
          <Form>
            <FormRow>
              <TextField
                errorMessage={errors.startedAt}
                label="Started At"
                value={values.startedAt}
                onChange={(value) => setFieldValue("startedAt", value)}
              />

              <TextField
                errorMessage={errors.endedAt}
                label="Ended At"
                value={values.endedAt}
                onChange={(value) => setFieldValue("endedAt", value)}
              />
            </FormRow>

            <CitizenSuggestionsField
              allowsCustomValue
              label={t("driver")}
              fromAuthUserOnly
              labelFieldName="citizenName"
              valueFieldName="citizenId"
            />

            <AsyncListSearchField<RegisteredVehicle>
              selectedKey={values.vehicleId}
              localValue={values.vehicleName}
              errorMessage={errors.vehicleId}
              onInputChange={(value) => setFieldValue("vehicleName", value)}
              onSelectionChange={(node) => {
                if (node) {
                  setFieldValue("vehicleId", node.key as string);
                }
              }}
              label={t("vehicle")}
              fetchOptions={{
                apiPath: (query) => `/vehicles/search?query=${query}&citizenId=${values.citizenId}`,
              }}
            >
              {(item) => (
                <Item key={item.id} textValue={item.model.value.value}>
                  {item.model.value.value} ({item.plate.toUpperCase()})
                </Item>
              )}
            </AsyncListSearchField>

            <TextField
              isTextarea
              isOptional
              errorMessage={errors.notes}
              label={t("notes")}
              value={values.notes}
              onChange={(value) => setFieldValue("notes", value)}
            />

            <footer className="flex justify-end mt-5">
              <div className="flex items-center">
                <Button type="reset" onPress={handleClose} variant="cancel">
                  {common("cancel")}
                </Button>
                <Button
                  className="flex items-center"
                  disabled={!isValid || state === "loading"}
                  type="submit"
                >
                  {state === "loading" ? <Loader className="mr-2" /> : null}
                  {log ? common("save") : common("create")}
                </Button>
              </div>
            </footer>
          </Form>
        )}
      </Formik>
    </Modal>
  );
}
