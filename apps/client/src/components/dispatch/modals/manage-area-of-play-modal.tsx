import { Loader, Button, TextField } from "@snailycad/ui";
import { Modal } from "components/modal/Modal";
import { useAuth } from "context/AuthContext";
import { useModal } from "state/modalState";
import { Form, Formik } from "formik";
import useFetch from "lib/useFetch";
import { ModalIds } from "types/modal-ids";
import { useTranslations } from "use-intl";
import type { PostDispatchAopData } from "@snailycad/types/api";

export function ManageAreaOfPlayModal() {
  const { state, execute } = useFetch();
  const modalState = useModal();
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
      modalState.closeModal(ModalIds.ManageAOP);
      setCad({ ...cad, ...json });
    }
  }

  const INITIAL_VALUES = {
    aop: "",
  };

  return (
    <Modal
      isOpen={modalState.isOpen(ModalIds.ManageAOP)}
      onClose={() => modalState.closeModal(ModalIds.ManageAOP)}
      title={t("updateAOP")}
      className="w-[600px]"
    >
      <Formik onSubmit={onSubmit} initialValues={INITIAL_VALUES}>
        {({ setFieldValue, values, errors, isValid }) => (
          <Form>
            <TextField
              errorMessage={errors.aop}
              autoFocus
              isRequired
              label={t("areaOfPlay")}
              value={values.aop}
              onChange={(value) => setFieldValue("aop", value)}
            />

            <footer className="flex justify-end gap-2">
              <Button
                variant="cancel"
                onPress={() => modalState.closeModal(ModalIds.ManageAOP)}
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
