import { Button } from "components/Button";
import { FormField } from "components/form/FormField";
import { Input } from "components/form/inputs/Input";
import { Loader } from "components/Loader";
import { Modal } from "components/modal/Modal";
import { useModal } from "context/ModalContext";
import { Form, Formik } from "formik";
import useFetch from "lib/useFetch";
import { ModalIds } from "types/ModalIds";
import { useTranslations } from "use-intl";
import { CREATE_COMPANY_SCHEMA } from "@snailycad/schemas";
import { handleValidate } from "lib/handleValidate";
import { useCitizen } from "context/CitizenContext";
import { Select } from "components/form/Select";
import { Toggle } from "components/form/Toggle";
import { useRouter } from "next/router";
import { FullEmployee } from "state/businessState";
import toast from "react-hot-toast";

interface Props {
  onCreate?(business: FullEmployee): void;
}

export function CreateBusinessModal({ onCreate }: Props) {
  const { isOpen, closeModal } = useModal();
  const { state, execute } = useFetch();
  const { citizens } = useCitizen();
  const router = useRouter();
  const common = useTranslations("Common");
  const t = useTranslations("Business");
  const error = useTranslations("Errors");

  function handleClose() {
    closeModal(ModalIds.CreateBusiness);
  }

  async function onSubmit(values: typeof INITIAL_VALUES) {
    const { json } = await execute("/businesses/create", {
      method: "POST",
      data: values,
    });

    if (json.id) {
      if (json.business.status === "PENDING") {
        toast.error(error("businessCreatedButPending"));
      } else {
        router.push(`/business/${json.id}/${json.employee?.id}`);
      }

      onCreate?.(json.employee);
      closeModal(ModalIds.CreateBusiness);
    }
  }

  const validate = handleValidate(CREATE_COMPANY_SCHEMA);
  const INITIAL_VALUES = {
    name: "",
    address: "",
    ownerId: "",
    whitelisted: false,
  };

  return (
    <Modal
      className="w-[600px]"
      title={t("createBusiness")}
      isOpen={isOpen(ModalIds.CreateBusiness)}
      onClose={handleClose}
    >
      <Formik validate={validate} onSubmit={onSubmit} initialValues={INITIAL_VALUES}>
        {({ handleChange, errors, values, isValid }) => (
          <Form>
            <FormField errorMessage={errors.ownerId} label={t("owner")}>
              <Select
                values={citizens.map((citizen) => ({
                  label: `${citizen.name} ${citizen.surname}`,
                  value: citizen.id,
                }))}
                name="ownerId"
                onChange={handleChange}
                value={values.ownerId}
              />
            </FormField>

            <FormField errorMessage={errors.name} label={t("name")}>
              <Input name="name" onChange={handleChange} value={values.name} />
            </FormField>

            <FormField errorMessage={errors.address} label={t("address")}>
              <Input name="address" onChange={handleChange} value={values.address} />
            </FormField>

            <FormField errorMessage={errors.whitelisted} label={t("whitelisted")}>
              <Toggle name="whitelisted" onClick={handleChange} toggled={values.whitelisted} />
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
                {t("createBusiness")}
              </Button>
            </footer>
          </Form>
        )}
      </Formik>
    </Modal>
  );
}
