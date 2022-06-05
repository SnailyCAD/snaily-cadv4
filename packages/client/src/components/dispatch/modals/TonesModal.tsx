import { Button } from "components/Button";
import { FormField } from "components/form/FormField";
import { Loader } from "components/Loader";
import { Modal } from "components/modal/Modal";
import { useAuth } from "context/AuthContext";
import { useModal } from "state/modalState";
import { Form, Formik } from "formik";
import useFetch from "lib/useFetch";
import { ModalIds } from "types/ModalIds";
import { useTranslations } from "use-intl";
import { Textarea } from "components/form/Textarea";
import { Toggle } from "components/form/Toggle";
import { FormRow } from "components/form/FormRow";

export function TonesModal() {
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
      closeModal(ModalIds.Tones);
      setCad({ ...cad, ...json });
    }
  }

  const INITIAL_VALUES = {
    emsFdTone: false,
    leoTone: false,
    description: "",
  };

  return (
    <Modal
      isOpen={isOpen(ModalIds.Tones)}
      onClose={() => closeModal(ModalIds.Tones)}
      title={t("tones")}
      className="w-[600px]"
    >
      <Formik onSubmit={onSubmit} initialValues={INITIAL_VALUES}>
        {({ handleChange, values, errors, isValid }) => (
          <Form>
            <p className="my-3 text-neutral-700 dark:text-gray-400">{t("notesInfo")}</p>

            <FormRow>
              <FormField errorMessage={errors.emsFdTone} label={t("emsFdTone")}>
                <Toggle name="emsFdTone" onClick={handleChange} toggled={values.emsFdTone} />
              </FormField>

              <FormField errorMessage={errors.leoTone} label={t("leoTone")}>
                <Toggle name="leoTone" onClick={handleChange} toggled={values.leoTone} />
              </FormField>
            </FormRow>

            <FormField errorMessage={errors.description} label={common("description")}>
              <Textarea
                autoFocus
                name="description"
                onChange={handleChange}
                value={values.description}
              />
            </FormField>

            <footer className="flex justify-end gap-2">
              <Button
                variant="cancel"
                onClick={() => closeModal(ModalIds.Tones)}
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
                {t("sendTone")}
              </Button>
            </footer>
          </Form>
        )}
      </Formik>
    </Modal>
  );
}
