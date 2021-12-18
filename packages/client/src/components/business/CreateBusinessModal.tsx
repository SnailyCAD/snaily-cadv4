import { Button } from "components/Button";
import { Error } from "components/form/Error";
import { FormField } from "components/form/FormField";
import { Input } from "components/form/Input";
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

export const CreateBusinessModal = () => {
  const { isOpen, closeModal } = useModal();
  const { state, execute } = useFetch();
  const { citizens } = useCitizen();
  const router = useRouter();
  const common = useTranslations("Common");
  const t = useTranslations("Business");

  function handleClose() {
    closeModal(ModalIds.CreateBusiness);
  }

  async function onSubmit(values: typeof INITIAL_VALUES) {
    const { json } = await execute("/businesses/create", {
      method: "POST",
      data: values,
    });

    if (json.id) {
      closeModal(ModalIds.CreateBusiness);
      router.push(`/business/${json.id}/${json.employeeId}`);
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
            <FormField label={t("owner")}>
              <Select
                values={citizens.map((citizen) => ({
                  label: `${citizen.name} ${citizen.surname}`,
                  value: citizen.id,
                }))}
                name="ownerId"
                onChange={handleChange}
                hasError={!!errors.ownerId}
                value={values.ownerId}
              />
              <Error>{errors.ownerId}</Error>
            </FormField>

            <FormField label={t("name")}>
              <Input
                id="name"
                onChange={handleChange}
                hasError={!!errors.name}
                value={values.name}
              />
              <Error>{errors.name}</Error>
            </FormField>

            <FormField label={t("address")}>
              <Input
                id="address"
                onChange={handleChange}
                hasError={!!errors.address}
                value={values.address}
              />
              <Error>{errors.address}</Error>
            </FormField>

            <FormField label={t("whitelisted")}>
              <Toggle name="whitelisted" onClick={handleChange} toggled={values.whitelisted} />
              <Error>{errors.whitelisted}</Error>
            </FormField>

            <footer className="mt-5 flex justify-end">
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
};
