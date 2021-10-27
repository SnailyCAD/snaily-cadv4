import { Button } from "components/Button";
import { FormField } from "components/form/FormField";
import { Input } from "components/form/Input";
import { Loader } from "components/Loader";
import { Modal } from "components/modal/Modal";
import { useAuth } from "context/AuthContext";
import { useModal } from "context/ModalContext";
import { Form, Formik } from "formik";
import useFetch from "lib/useFetch";
import { ModalIds } from "types/ModalIds";
import { useTranslations } from "use-intl";

export const ManageAOPModal = () => {
  const { state, execute } = useFetch();
  const { closeModal, isOpen } = useModal();
  const { cad, setCad } = useAuth();

  const t = useTranslations("Leo");
  const common = useTranslations("Common");

  async function onSubmit(values: typeof INITIAL_VALUES) {
    const { json } = await execute("/dispatch/aop", {
      method: "POST",
      data: values,
    });

    if (json) {
      closeModal(ModalIds.ManageAOP);
      setCad({ ...cad, ...json });
    }
  }

  const INITIAL_VALUES = {
    aop: "",
  };

  return (
    <Modal
      isOpen={isOpen(ModalIds.ManageAOP)}
      onClose={() => closeModal(ModalIds.ManageAOP)}
      title={t("updateAOP")}
      className="min-w-[600px]"
    >
      <Formik onSubmit={onSubmit} initialValues={INITIAL_VALUES}>
        {({ handleChange, values, errors, isValid }) => (
          <Form>
            <FormField fieldId="aop" label={t("areaOfPlay")}>
              <Input
                autoFocus
                id="aop"
                onChange={handleChange}
                value={values.aop}
                hasError={!!errors.aop}
                required
              />
            </FormField>

            <footer className="flex justify-end">
              <Button
                className="flex items-center"
                disabled={!isValid || state === "loading"}
                type="submit"
              >
                {state === "loading" ? <Loader className="mr-2" /> : null}
                {common("save")}
              </Button>
            </footer>
          </Form>
        )}
      </Formik>
    </Modal>
  );
};
