import { Textarea, Loader, Button } from "@snailycad/ui";
import { FormField } from "components/form/FormField";
import { Modal } from "components/modal/Modal";
import { useModal } from "state/modalState";
import { Form, Formik } from "formik";
import useFetch from "lib/useFetch";
import { ModalIds } from "types/ModalIds";
import { useTranslations } from "use-intl";
import { Toggle } from "components/form/Toggle";
import { FormRow } from "components/form/FormRow";
import { handleValidate } from "lib/handleValidate";
import { TONES_SCHEMA } from "@snailycad/schemas";
import { toastMessage } from "lib/toastMessage";
import type { PostDispatchTonesData } from "@snailycad/types/api";

interface Props {
  types: ("leo" | "ems-fd")[];
}

export function TonesModal({ types }: Props) {
  const { state, execute } = useFetch();
  const { closeModal, isOpen } = useModal();

  const t = useTranslations("Leo");
  const common = useTranslations("Common");

  async function onSubmit(values: typeof INITIAL_VALUES) {
    const { json } = await execute<PostDispatchTonesData>({
      path: "/dispatch/tones",
      method: "POST",
      data: values,
    });

    if (json) {
      closeModal(ModalIds.Tones);
      toastMessage({
        message: t("toneSuccess"),
        icon: "success",
      });
    }
  }

  const validate = handleValidate(TONES_SCHEMA);
  const INITIAL_VALUES = {
    emsFdTone: !!types.every((v) => v === "ems-fd"),
    leoTone: !!types.every((v) => v === "leo"),
    description: "",
    types,
  };

  return (
    <Modal
      isOpen={isOpen(ModalIds.Tones)}
      onClose={() => closeModal(ModalIds.Tones)}
      title={t("tones")}
      className="w-[600px]"
    >
      <Formik validate={validate} onSubmit={onSubmit} initialValues={INITIAL_VALUES}>
        {({ handleChange, values, errors, isValid }) => (
          <Form>
            <p className="my-3 text-neutral-700 dark:text-gray-400">{t("notesInfo")}</p>

            <FormRow>
              {types.includes("ems-fd") ? (
                <FormField errorMessage={errors.emsFdTone} label={t("emsFdTone")}>
                  <Toggle
                    name="emsFdTone"
                    onCheckedChange={handleChange}
                    value={values.emsFdTone}
                  />
                </FormField>
              ) : null}

              {types.includes("leo") ? (
                <FormField errorMessage={errors.leoTone} label={t("leoTone")}>
                  <Toggle name="leoTone" onCheckedChange={handleChange} value={values.leoTone} />
                </FormField>
              ) : null}
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
                onPress={() => closeModal(ModalIds.Tones)}
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
