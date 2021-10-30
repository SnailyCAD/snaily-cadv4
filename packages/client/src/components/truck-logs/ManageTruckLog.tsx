import { CREATE_TRUCK_LOG_SCHEMA } from "@snailycad/schemas";
import { Button } from "components/Button";
import { Error } from "components/form/Error";
import { FormField } from "components/form/FormField";
import { FormRow } from "components/form/FormRow";
import { Input } from "components/form/Input";
import { Select } from "components/form/Select";
import { Loader } from "components/Loader";
import { Modal } from "components/modal/Modal";
import { useCitizen } from "context/CitizenContext";
import { useModal } from "context/ModalContext";
import { Formik } from "formik";
import { handleValidate } from "lib/handleValidate";
import useFetch from "lib/useFetch";
import { FullTruckLog } from "src/pages/truck-logs";
import { ModalIds } from "types/ModalIds";
import { RegisteredVehicle } from "types/prisma";
import { useTranslations } from "use-intl";

interface Props {
  log: FullTruckLog | null;
  registeredVehicles: RegisteredVehicle[];
  onUpdate?: (old: FullTruckLog, newLog: FullTruckLog) => void;
  onCreate?: (log: FullTruckLog) => void;
  onClose?: () => void;
}

export const ManageTruckLogModal = ({
  onUpdate,
  onCreate,
  onClose,
  registeredVehicles,
  log,
}: Props) => {
  const common = useTranslations("Common");
  const t = useTranslations("TruckLogs");
  const { isOpen, closeModal } = useModal();
  const { state, execute } = useFetch();
  const { citizens } = useCitizen();

  function handleClose() {
    onClose?.();
    closeModal(ModalIds.ManageTruckLog);
  }

  async function onSubmit(values: typeof INITIAL_VALUES) {
    if (log) {
      const { json } = await execute(`/truck-logs/${log.id}`, {
        method: "PUT",
        data: values,
      });

      if (json.id) {
        onUpdate?.(log, json);
        closeModal(ModalIds.ManageTruckLog);
      }
    } else {
      const { json } = await execute("/truck-logs", {
        method: "POST",
        data: values,
      });

      if (json.id) {
        onCreate?.(json);
        closeModal(ModalIds.ManageTruckLog);
      }
    }
  }

  const INITIAL_VALUES = {
    endedAt: log?.endedAt ?? "",
    startedAt: log?.startedAt ?? "",
    vehicleId: log?.vehicleId ?? "",
    citizenId: log?.citizenId ?? "",
  };

  const validate = handleValidate(CREATE_TRUCK_LOG_SCHEMA);

  return (
    <Modal
      onClose={handleClose}
      title={log ? t("editTruckLog") : t("createTruckLog")}
      isOpen={isOpen(ModalIds.ManageTruckLog)}
      className="min-w-[700px]"
    >
      <Formik validate={validate} initialValues={INITIAL_VALUES} onSubmit={onSubmit}>
        {({ handleSubmit, handleChange, values, isValid, errors }) => (
          <form onSubmit={handleSubmit}>
            <FormRow>
              <FormField label={t("startedAt")}>
                <Input onChange={handleChange} name="startedAt" value={values.startedAt} />
                <Error>{errors.startedAt}</Error>
              </FormField>

              <FormField label={t("endedAt")}>
                <Input onChange={handleChange} name="endedAt" value={values.endedAt} />
                <Error>{errors.endedAt}</Error>
              </FormField>
            </FormRow>

            <FormField label={t("driver")}>
              <Select
                name="citizenId"
                onChange={handleChange}
                values={citizens.map((citizen) => ({
                  label: `${citizen.name} ${citizen.surname}`,
                  value: citizen.id,
                }))}
                value={values.citizenId}
              />
              <Error>{errors.citizenId}</Error>
            </FormField>

            <FormField label={t("vehicle")}>
              <Select
                name="vehicleId"
                onChange={handleChange}
                values={registeredVehicles.map((vehicle) => ({
                  label: vehicle.model.value.value,
                  value: vehicle.id,
                }))}
                value={values.vehicleId}
              />
              <Error>{errors.vehicleId}</Error>
            </FormField>

            <footer className="mt-5 flex justify-end">
              <div className="flex items-center">
                <Button type="reset" onClick={handleClose} variant="cancel">
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
          </form>
        )}
      </Formik>
    </Modal>
  );
};
