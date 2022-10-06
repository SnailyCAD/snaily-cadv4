import { Button } from "@snailycad/ui";
import { FormField } from "components/form/FormField";
import { Input } from "@snailycad/ui";
import { Loader } from "components/Loader";
import { Modal } from "components/modal/Modal";
import { useAuth } from "context/AuthContext";
import { useModal } from "state/modalState";
import { Form, Formik } from "formik";
import useFetch from "lib/useFetch";
import { ModalIds } from "types/ModalIds";
import { useTranslations } from "use-intl";
import type { PostDispatchAopData } from "@snailycad/types/api";

export function ManageAOPModal() {
  const { state, execute } = useFetch();
  const { closeModal, isOpen } = useModal();
  const { cad, setCad } = useAuth();

  const t = useTranslations("Leo");
  const common = useTranslations("Common");

  async function onSubmit(values: typeof INITIAL_VALUES) {
    if (!cad) return;

    const { json } = await execute<PostDispatchAopData>({
      path: "/dispatch/aop",
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
      className="w-[600px]"
    >
      <Formik onSubmit={onSubmit} initialValues={INITIAL_VALUES}>
        {({ handleChange, values, errors, isValid }) => (
          <Form>
            <FormField errorMessage={errors.aop} label={t("areaOfPlay")}>
              <Input autoFocus name="aop" onChange={handleChange} value={values.aop} required />
            </FormField>

            <footer className="flex justify-end gap-2">
              <Button
                variant="cancel"
                onPress={() => closeModal(ModalIds.ManageAOP)}
                className="flex items-center"
                type="reset"
              >
                {common("cancel")}
              </Button>
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
}
