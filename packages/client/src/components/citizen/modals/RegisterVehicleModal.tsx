import { useTranslations } from "use-intl";
import { Formik } from "formik";
import { VEHICLE_SCHEMA } from "@snailycad/schemas";
import { Button } from "components/Button";
import { Error } from "components/form/Error";
import { FormField } from "components/form/FormField";
import { Select } from "components/form/Select";
import { Loader } from "components/Loader";
import { Modal } from "components/modal/Modal";
import useFetch from "lib/useFetch";
import { useValues } from "src/context/ValuesContext";
import { useModal } from "context/ModalContext";
import { ModalIds } from "types/ModalIds";
import { Citizen, RegisteredVehicle } from "types/prisma";
import { handleValidate } from "lib/handleValidate";
import { Input } from "components/form/Input";
import { useCitizen } from "context/CitizenContext";
import { useRouter } from "next/router";

interface Props {
  vehicle: RegisteredVehicle | null;
  citizens: Citizen[];
  onCreate?: (newV: RegisteredVehicle) => void;
  onUpdate?: (old: RegisteredVehicle, newV: RegisteredVehicle) => void;
  onClose?: () => void;
}

export const RegisterVehicleModal = ({
  citizens = [],
  vehicle,
  onClose,
  onCreate,
  onUpdate,
}: Props) => {
  const { state, execute } = useFetch();
  const { isOpen, closeModal } = useModal();
  const t = useTranslations("Citizen");
  const tVehicle = useTranslations("Vehicles");
  const common = useTranslations("Common");
  const { citizen } = useCitizen(false);
  const router = useRouter();

  const { vehicles, licenses } = useValues();
  const validate = handleValidate(VEHICLE_SCHEMA);
  const isDisabled = router.pathname === "/citizen/[id]";

  function handleClose() {
    closeModal(ModalIds.RegisterVehicle);
    onClose?.();
  }

  async function onSubmit(values: typeof INITIAL_VALUES) {
    if (vehicle) {
      const { json } = await execute(`/vehicles/${vehicle.id}`, {
        method: "PUT",
        data: values,
      });

      if (json?.id) {
        onUpdate?.(vehicle, json);
      }
    } else {
      const { json } = await execute("/vehicles", {
        method: "POST",
        data: values,
      });

      if (json?.id) {
        onCreate?.(json);
      }
    }
  }

  const INITIAL_VALUES = {
    model: vehicle?.model ?? "",
    color: vehicle?.color ?? "",
    insuranceStatus: vehicle?.insuranceStatus ?? "",
    registrationStatus: vehicle?.registrationStatus ?? "",
    citizenId: isDisabled ? citizen.id : vehicle?.citizenId ?? "",
    plate: vehicle?.plate ?? "",
  };

  return (
    <Modal
      title={t("registerVehicle")}
      onClose={handleClose}
      isOpen={isOpen(ModalIds.RegisterVehicle)}
      className="min-w-[600px] min-h-[400px]"
    >
      <Formik validate={validate} onSubmit={onSubmit} initialValues={INITIAL_VALUES}>
        {({ handleSubmit, handleChange, errors, values, isValid }) => (
          <form onSubmit={handleSubmit}>
            <FormField fieldId="plate" label={tVehicle("plate")}>
              <Input
                disabled={!!vehicle}
                hasError={!!errors.plate}
                onChange={handleChange}
                id="plate"
                value={values.plate}
              />
              <Error>{errors.plate}</Error>
            </FormField>

            <FormField fieldId="model" label={tVehicle("model")}>
              <Select
                hasError={!!errors.model}
                values={vehicles.values.map((vehicle) => ({
                  label: vehicle.value,
                  value: vehicle.value,
                }))}
                value={values.model}
                name="model"
                onChange={handleChange}
              />
              <Error>{errors.model}</Error>
            </FormField>

            <FormField fieldId="citizenId" label={tVehicle("owner")}>
              <Select
                hasError={!!errors.citizenId}
                values={
                  isDisabled
                    ? [{ value: citizen.id, label: `${citizen.name} ${citizen.surname}` }]
                    : citizens.map((citizen) => ({
                        label: `${citizen.name} ${citizen.surname}`,
                        value: citizen.id,
                      }))
                }
                value={isDisabled ? citizen.id : values.citizenId}
                name="citizenId"
                onChange={handleChange}
                disabled={isDisabled}
              />
              <Error>{errors.citizenId}</Error>
            </FormField>

            <FormField fieldId="registrationStatus" label={tVehicle("registrationStatus")}>
              <Select
                hasError={!!errors.registrationStatus}
                values={licenses.values.map((license) => ({
                  label: license.value,
                  value: license.value,
                }))}
                value={values.registrationStatus}
                name="registrationStatus"
                onChange={handleChange}
              />
              <Error>{errors.registrationStatus}</Error>
            </FormField>

            <FormField fieldId="color" label={tVehicle("color")}>
              <Input
                hasError={!!errors.color}
                onChange={handleChange}
                id="color"
                value={values.color}
              />
              <Error>{errors.color}</Error>
            </FormField>

            <footer className="mt-5 flex justify-end">
              <Button
                type="reset"
                onClick={() => closeModal(ModalIds.RegisterVehicle)}
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
                {vehicle ? common("save") : t("registerVehicle")}
              </Button>
            </footer>
          </form>
        )}
      </Formik>
    </Modal>
  );
};
