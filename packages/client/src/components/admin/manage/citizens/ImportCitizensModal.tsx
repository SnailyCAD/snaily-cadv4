import * as React from "react";
import { Button } from "components/Button";
import { FormField } from "components/form/FormField";
import { Input } from "components/form/inputs/Input";
import { Loader } from "components/Loader";
import { Modal } from "components/modal/Modal";
import { Formik, FormikHelpers } from "formik";
import useFetch from "lib/useFetch";
import { useModal } from "context/ModalContext";
import { useTranslations } from "use-intl";
import { ModalIds } from "types/ModalIds";

interface Props {
  onImport: (data: any[]) => void;
}

export function ImportCitizensModal({ onImport }: Props) {
  const [file, setFile] = React.useState<File | null>(null);

  const { state, execute } = useFetch();
  const { isOpen, closeModal } = useModal();
  const t = useTranslations("Values");

  async function onSubmit(_: any, helpers: FormikHelpers<typeof INITIAL_VALUES>) {
    const fd = new FormData();

    if (file?.size && file.name) {
      if (file.type !== "application/json") {
        helpers.setFieldError("file", "Only .json is supported");
        return;
      }

      fd.set("file", file, file.name);
    }

    const { json } = await execute("/admin/manage/citizens/import", {
      method: "POST",
      data: fd,
    });

    if (Array.isArray(json)) {
      onImport(json);
      closeModal(ModalIds.ImportCitizens);
    }
  }

  const INITIAL_VALUES = {
    file: "",
  };

  return (
    <Modal
      className="w-[600px]"
      title={"Import Citizens"}
      onClose={() => closeModal(ModalIds.ImportCitizens)}
      isOpen={isOpen(ModalIds.ImportCitizens)}
    >
      <Formik onSubmit={onSubmit} initialValues={INITIAL_VALUES}>
        {({ handleSubmit, handleChange, values, errors }) => (
          <form onSubmit={handleSubmit}>
            <FormField errorMessage={errors.file} label={t("file")}>
              <div className="flex">
                <Input
                  style={{ width: "95%", marginRight: "0.5em" }}
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

            <p>
              <a
                className="underline"
                target="_blank"
                rel="noreferrer"
                href="https://cad-docs.netlify.app/other/importing-values#citizens"
              >
                Documentation
              </a>
            </p>

            <footer className="flex justify-end mt-5">
              <Button
                type="reset"
                onClick={() => closeModal(ModalIds.ImportCitizens)}
                variant="cancel"
              >
                Cancel
              </Button>
              <Button className="flex items-center" disabled={state === "loading"} type="submit">
                {state === "loading" ? <Loader className="mr-2" /> : null}
                {"Import"}
              </Button>
            </footer>
          </form>
        )}
      </Formik>
    </Modal>
  );
}
