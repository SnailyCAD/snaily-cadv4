import { Button } from "components/Button";
import { FormField } from "components/form/FormField";
import { Input } from "components/form/Input";
import { Loader } from "components/Loader";
import { Modal } from "components/modal/Modal";
import { Formik } from "formik";
import useFetch from "lib/useFetch";
import { useModal } from "src/hooks/useModal";
import { ModalIds } from "types/ModalIds";
import { RegisteredVehicle } from "types/prisma";
import { useTranslations } from "use-intl";

interface Props {
  vehicle: RegisteredVehicle | null;
}

export const RegisterVehicleModal = ({ vehicle }: Props) => {
  const { state } = useFetch();
  const { isOpen, closeModal } = useModal();
  const t = useTranslations("Citizen");
  const tVehicle = useTranslations("Vehicles");

  async function onSubmit(values: typeof INITIAL_VALUES) {}

  const INITIAL_VALUES = {
    model: vehicle?.model ?? "",
    color: vehicle?.color ?? "",
    insuranceStatus: vehicle?.insuranceStatus ?? "",
    registrationStatus: vehicle?.registrationStatus ?? "",
    citizenId: vehicle?.citizenId ?? "",
  };

  return (
    <Modal
      title={t("registerVehicle")}
      onClose={() => closeModal(ModalIds.RegisterVehicle)}
      isOpen={isOpen(ModalIds.RegisterVehicle)}
      minWidth="min-w-[600px]"
    >
      <Formik onSubmit={onSubmit} initialValues={INITIAL_VALUES}>
        {({ handleSubmit, handleChange }) => (
          <form onSubmit={handleSubmit}>
            <FormField fieldId="model" label={tVehicle("model")}>
              <Input onChange={handleChange} id="model" />
            </FormField>

            <footer className="mt-5 flex justify-end">
              <Button type="reset" onClick={() => closeModal("manageValue")} variant="cancel">
                Cancel
              </Button>
              <Button className="flex items-center" disabled={state === "loading"} type="submit">
                {state === "loading" ? <Loader className="mr-2" /> : null}
                {t("registerVehicle")}
              </Button>
            </footer>
          </form>
        )}
      </Formik>
    </Modal>
  );
};
