import { Button } from "components/Button";
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
import { type FullBusiness, useBusinessState } from "state/businessState";
import { toastError } from "lib/error";
import { WhitelistStatus } from "@snailycad/types";

interface Props {
  onCreate: (business: FullBusiness) => void;
}

export function JoinBusinessModal({ onCreate }: Props) {
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

      if (!json.business.whitelisted) {
        router.push(`/business/${json.businessId}/${json.id}`);
      } else {
        toastError({ icon: null, message: t("businessIsWhitelisted") });
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
      className="w-[600px]"
      title={t("joinBusiness")}
      isOpen={isOpen(ModalIds.JoinBusiness)}
      onClose={handleClose}
    >
      <Formik validate={validate} onSubmit={onSubmit} initialValues={INITIAL_VALUES}>
        {({ handleChange, errors, values, isValid }) => (
          <Form>
            <FormField errorMessage={errors.citizenId} label={t("citizen")}>
              <Select
                values={citizens.map((citizen) => ({
                  label: `${citizen.name} ${citizen.surname}`,
                  value: citizen.id,
                }))}
                name="citizenId"
                onChange={handleChange}
                value={values.citizenId}
              />
            </FormField>

            <FormField errorMessage={errors.businessId} label={t("business")}>
              <Select
                values={joinableBusinesses
                  .filter((v) => v.status !== WhitelistStatus.DECLINED)
                  .map((business) => ({
                    label: business.name,
                    value: business.id,
                  }))}
                name="businessId"
                onChange={handleChange}
                value={values.businessId}
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
                {t("joinBusiness")}
              </Button>
            </footer>
          </Form>
        )}
      </Formik>
    </Modal>
  );
}
