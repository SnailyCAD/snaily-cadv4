import * as React from "react";
import { FormField } from "components/form/FormField";
import { Input, Loader, Button } from "@snailycad/ui";
import { Modal } from "components/modal/Modal";
import { Form, Formik, type FormikHelpers } from "formik";
import useFetch from "lib/useFetch";
import { useModal } from "state/modalState";
import { useTranslations } from "use-intl";
import { ModalIds } from "types/modal-ids";
import type { PostBlacklistedWordsData } from "@snailycad/types/api";

interface Props {
  onImport(data: PostBlacklistedWordsData): void;
}

export function ImportBlacklistedWordsModal({ onImport }: Props) {
  const [file, setFile] = React.useState<File | null>(null);

  const { state, execute } = useFetch();
  const modalState = useModal();
  const t = useTranslations("BlacklistedWords");
  const common = useTranslations("Common");

  async function onSubmit(_: any, helpers: FormikHelpers<typeof INITIAL_VALUES>) {
    const fd = new FormData();

    if (file?.size && file.name) {
      if (file.type !== "application/json") {
        helpers.setFieldError("file", "Only .json is supported");
        return;
      }

      fd.set("file", file, file.name);
    }

    const { json } = await execute<PostBlacklistedWordsData>({
      path: "/admin/manage/cad-settings/blacklisted-words",
      method: "POST",
      data: fd,
    });

    if (Array.isArray(json)) {
      onImport(json);
    }

    modalState.closeModal(ModalIds.ImportBlacklistedWords);
  }

  const INITIAL_VALUES = {
    file: "",
  };

  return (
    <Modal
      className="w-[600px]"
      title={t("importBlacklistedWords")}
      onClose={() => modalState.closeModal(ModalIds.ImportBlacklistedWords)}
      isOpen={modalState.isOpen(ModalIds.ImportBlacklistedWords)}
    >
      <Formik onSubmit={onSubmit} initialValues={INITIAL_VALUES}>
        {({ handleChange, values, errors }) => (
          <Form>
            <FormField errorMessage={errors.file} label={t("file")}>
              <div className="flex">
                <Input
                  onChange={(e) => {
                    handleChange(e);
                    setFile(e.target.files?.[0] ?? null);
                  }}
                  type="file"
                  name="file"
                  value={values.file}
                  accept=".json"
                />
              </div>
            </FormField>

            <footer className="flex justify-end mt-5">
              <Button
                type="reset"
                onPress={() => modalState.closeModal(ModalIds.ImportBlacklistedWords)}
                variant="cancel"
              >
                {common("cancel")}
              </Button>
              <Button className="flex items-center" disabled={state === "loading"} type="submit">
                {state === "loading" ? <Loader className="mr-2" /> : null}
                {common("import")}
              </Button>
            </footer>
          </Form>
        )}
      </Formik>
    </Modal>
  );
}
