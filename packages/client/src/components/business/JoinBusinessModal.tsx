import { Button } from "components/Button";
import { Error } from "components/form/Error";
import { FormField } from "components/form/FormField";
import { Loader } from "components/Loader";
import { Modal } from "components/modal/Modal";
import { useModal } from "context/ModalContext";
import { Form, Formik } from "formik";
import useFetch from "lib/useFetch";
import { ModalIds } from "types/ModalIds";
import { useTranslations } from "use-intl";
import { JOIN_COMPANY_SCHEMA } from "@snailycad/schemas";
import { handleValidate } from "lib/handleValidate";
import { useCitizen } from "context/CitizenContext";
import { Select } from "components/form/Select";
import { useRouter } from "next/router";
import { FullBusiness, useBusinessState } from "state/businessState";

interface Props {
  onCreate: (business: FullBusiness) => void;
}

export const JoinBusinessModal = ({ onCreate }: Props) => {
  const joinableBusinesses = useBusinessState((s) => s.joinableBusinesses);
  const { isOpen, closeModal } = useModal();
  const { state, execute } = useFetch();
  const { citizens } = useCitizen();
  const router = useRouter();
  const common = useTranslations("Common");
  const t = useTranslations("Business");

  function handleClose() {
    closeModal(ModalIds.JoinBusiness);
  }

  async function onSubmit(values: typeof INITIAL_VALUES) {
    const { json } = await execute("/businesses/join", {
      method: "POST",
      data: values,
    });

    if (json.id) {
      closeModal(ModalIds.JoinBusiness);
      onCreate(json);

      if (!json.whitelisted) {
        router.push(`/business/${json.id}/${json.citizenId}`);
      } else {
        // notify
      }
    }
  }

  const validate = handleValidate(JOIN_COMPANY_SCHEMA);
  const INITIAL_VALUES = {
    businessId: "",
    citizenId: "",
  };

  return (
    <Modal
      className="min-w-[600px]"
      title={t("joinBusiness")}
      isOpen={isOpen(ModalIds.JoinBusiness)}
      onClose={handleClose}
    >
      <Formik validate={validate} onSubmit={onSubmit} initialValues={INITIAL_VALUES}>
        {({ handleChange, errors, values, isValid }) => (
          <Form>
            <FormField fieldId="citizenId" label={t("citizen")}>
              <Select
                values={citizens.map((citizen) => ({
                  label: `${citizen.name} ${citizen.surname}`,
                  value: citizen.id,
                }))}
                name="citizenId"
                onChange={handleChange}
                hasError={!!errors.citizenId}
                value={values.citizenId}
              />
              <Error>{errors.citizenId}</Error>
            </FormField>

            <FormField fieldId="businessId" label={t("business")}>
              <Select
                values={joinableBusinesses.map((business) => ({
                  label: business.name,
                  value: business.id,
                }))}
                name="businessId"
                onChange={handleChange}
                hasError={!!errors.businessId}
                value={values.businessId}
              />
              <Error>{errors.businessId}</Error>
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
                {t("joinBusiness")}
              </Button>
            </footer>
          </Form>
        )}
      </Formik>
    </Modal>
  );
};
