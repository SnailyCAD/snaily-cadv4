import { Input, Loader, Button } from "@snailycad/ui";
import { FormField } from "components/form/FormField";
import { Modal } from "components/modal/Modal";
import { useModal } from "state/modalState";
import { Form, Formik } from "formik";
import useFetch from "lib/useFetch";
import { ModalIds } from "types/ModalIds";
import { useTranslations } from "use-intl";
import { CREATE_COMPANY_SCHEMA } from "@snailycad/schemas";
import { handleValidate } from "lib/handleValidate";
import { Toggle } from "components/form/Toggle";
import { useRouter } from "next/router";
import { FormRow } from "components/form/FormRow";
import { toastMessage } from "lib/toastMessage";
import { WhitelistStatus } from "@snailycad/types";
import { CitizenSuggestionsField } from "components/shared/CitizenSuggestionsField";
import type { GetBusinessesData, PostCreateBusinessData } from "@snailycad/types/api";

interface Props {
  onCreate?(employee: GetBusinessesData["businesses"][number]): void;
}

export function CreateBusinessModal({ onCreate }: Props) {
  const { isOpen, closeModal } = useModal();
  const { state, execute } = useFetch();
  const router = useRouter();
  const common = useTranslations("Common");
  const t = useTranslations("Business");
  const error = useTranslations("Errors");

  function handleClose() {
    closeModal(ModalIds.CreateBusiness);
  }

  async function onSubmit(values: typeof INITIAL_VALUES) {
    const { json } = await execute<PostCreateBusinessData>({
      path: "/businesses/create",
      method: "POST",
      data: values,
    });

    if (json.id) {
      if (json.business.status === WhitelistStatus.PENDING) {
        toastMessage({ icon: null, message: error("businessCreatedButPending") });
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
    postal: "",
    ownerId: "",
    ownerName: "",
    whitelisted: false,
  };

  return (
    <Modal
      className="w-[700px]"
      title={t("createBusiness")}
      isOpen={isOpen(ModalIds.CreateBusiness)}
      onClose={handleClose}
    >
      <Formik validate={validate} onSubmit={onSubmit} initialValues={INITIAL_VALUES}>
        {({ handleChange, errors, values, isValid }) => (
          <Form>
            <FormField errorMessage={errors.ownerId} label={t("citizen")}>
              <CitizenSuggestionsField
                fromAuthUserOnly
                labelFieldName="ownerName"
                valueFieldName="ownerId"
              />
            </FormField>

            <FormField errorMessage={errors.name} label={t("name")}>
              <Input name="name" onChange={handleChange} value={values.name} />
            </FormField>

            <FormRow flexLike>
              <FormField className="w-full" errorMessage={errors.address} label={t("address")}>
                <Input
                  className="w-full"
                  name="address"
                  onChange={handleChange}
                  value={values.address}
                />
              </FormField>

              <FormField optional errorMessage={errors.postal} label={common("postal")}>
                <Input
                  className="min-w-[200px]"
                  name="postal"
                  onChange={handleChange}
                  value={values.postal}
                />
              </FormField>
            </FormRow>

            <FormField errorMessage={errors.whitelisted} label={t("whitelisted")}>
              <Toggle
                name="whitelisted"
                onCheckedChange={handleChange}
                value={values.whitelisted}
              />
            </FormField>

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
                {t("createBusiness")}
              </Button>
            </footer>
          </Form>
        )}
      </Formik>
    </Modal>
  );
}
