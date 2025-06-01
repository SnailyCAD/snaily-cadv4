import { Loader, Button, SelectField } from "@snailycad/ui";
import { Modal } from "components/modal/Modal";
import { useModal } from "state/modalState";
import { Form, Formik, type FormikHelpers } from "formik";
import useFetch from "lib/useFetch";
import { ModalIds } from "types/modal-ids";
import { useTranslations } from "use-intl";
import { JOIN_COMPANY_SCHEMA } from "@snailycad/schemas";
import { handleValidate } from "lib/handleValidate";
import { useRouter } from "next/router";
import { useBusinessState } from "state/business-state";
import { toastMessage } from "lib/toastMessage";
import { WhitelistStatus } from "@snailycad/types";
import { CitizenSuggestionsField } from "components/shared/CitizenSuggestionsField";
import type { GetBusinessesData, PostJoinBusinessData } from "@snailycad/types/api";

interface Props {
  onCreate?(business: GetBusinessesData["ownedBusinesses"][number]): void;
}

export function JoinBusinessModal({ onCreate }: Props) {
  const joinableBusinesses = useBusinessState((s) => s.joinableBusinesses);
  const modalState = useModal();
  const { state, execute } = useFetch();
  const router = useRouter();
  const common = useTranslations("Common");
  const t = useTranslations("Business");

  function handleClose() {
    modalState.closeModal(ModalIds.JoinBusiness);
  }

  async function onSubmit(
    values: typeof INITIAL_VALUES,
    helpers: FormikHelpers<typeof INITIAL_VALUES>,
  ) {
    const { json } = await execute<PostJoinBusinessData, typeof INITIAL_VALUES>({
      path: "/businesses/join",
      method: "POST",
      data: values,
      helpers,
    });

    if (json.id) {
      modalState.closeModal(ModalIds.JoinBusiness);
      onCreate?.(json);

      if (!json.business.whitelisted) {
        router.push(`/business/${json.businessId}/${json.id}`);
      } else {
        toastMessage({ icon: null, message: t("businessIsWhitelisted") });
      }
    }
  }

  const validate = handleValidate(JOIN_COMPANY_SCHEMA);
  const INITIAL_VALUES = {
    businessId: "",
    citizenId: "",
    citizenName: "",
  };

  return (
    <Modal
      className="w-[600px]"
      title={t("joinBusiness")}
      isOpen={modalState.isOpen(ModalIds.JoinBusiness)}
      onClose={handleClose}
    >
      <Formik validate={validate} onSubmit={onSubmit} initialValues={INITIAL_VALUES}>
        {({ setFieldValue, errors, values, isValid }) => (
          <Form>
            <CitizenSuggestionsField
              autoFocus
              allowsCustomValue
              label={t("citizen")}
              fromAuthUserOnly
              labelFieldName="citizenName"
              valueFieldName="citizenId"
            />

            <SelectField
              errorMessage={errors.businessId}
              label={t("business")}
              onSelectionChange={(key) => setFieldValue("businessId", key)}
              selectedKey={values.businessId}
              options={joinableBusinesses
                .filter((v) => v.status !== WhitelistStatus.DECLINED)
                .map((business) => ({
                  label: business.name,
                  value: business.id,
                }))}
            />

            <footer className="flex justify-end mt-5">
              <Button type="reset" onPress={handleClose} variant="cancel">
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
