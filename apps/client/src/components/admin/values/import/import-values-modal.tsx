import * as React from "react";
import { FormField } from "components/form/FormField";
import { Input, Loader, Button } from "@snailycad/ui";
import { Modal } from "components/modal/Modal";
import { Form, Formik, FormikHelpers } from "formik";
import useFetch from "lib/useFetch";
import { useModal } from "state/modalState";
import { useTranslations } from "use-intl";
import { ModalIds } from "types/ModalIds";
import type { ValueType } from "@snailycad/types";
import type { ImportValuesData } from "@snailycad/types/api";

interface Props {
  type: ValueType;
  onImport(data: any[]): void;
}

export function ImportValuesModal({ onImport, type }: Props) {
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

    const { json } = await execute<ImportValuesData>({
      path: `/admin/values/import/${type.toLowerCase()}`,
      method: "POST",
      data: fd,
    });

    if (Array.isArray(json)) {
      onImport(json);
    }

    closeModal(ModalIds.ImportValues);
  }

  const INITIAL_VALUES = {
    file: "",
  };

  return (
    <Modal
      className="w-[600px]"
      title={"Import values"}
      onClose={() => closeModal(ModalIds.ImportValues)}
      isOpen={isOpen(ModalIds.ImportValues)}
    >
      <Formik onSubmit={onSubmit} initialValues={INITIAL_VALUES}>
        {({ handleChange, values, errors }) => (
          <Form>
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

            <a
              className="underline"
              target="_blank"
              rel="noreferrer"
              href="https://docs.snailycad.org/docs/developer/importing-values"
            >
              Documentation
            </a>

            <footer className="flex justify-end mt-5">
              <Button
                type="reset"
                onPress={() => closeModal(ModalIds.ImportValues)}
                variant="cancel"
              >
                Cancel
              </Button>
              <Button className="flex items-center" disabled={state === "loading"} type="submit">
                {state === "loading" ? <Loader className="mr-2" /> : null}
                {"Import"}
              </Button>
            </footer>
          </Form>
        )}
      </Formik>
    </Modal>
  );
}
