import * as React from "react";
import { FormField } from "components/form/FormField";
import { Button, Input, Loader } from "@snailycad/ui";
import { Modal } from "components/modal/Modal";
import { Form, Formik, FormikHelpers } from "formik";
import useFetch from "lib/useFetch";
import { useModal } from "state/modalState";
import { useTranslations } from "use-intl";
import { ModalIds } from "types/ModalIds";
import type * as APITypes from "@snailycad/types/api";

type ImportData =
  | APITypes.PostImportCitizensData
  | APITypes.PostImportVehiclesData
  | APITypes.PostImportWeaponsData;

interface Props<T extends ImportData> {
  onImport(data: T): void;
  url: `/admin/import/${"vehicles" | "weapons" | "citizens"}/file`;
  id: ModalIds.ImportCitizens | ModalIds.ImportVehicles | ModalIds.ImportWeapons;
}

export function ImportModal<T extends ImportData>({ onImport, id, url }: Props<T>) {
  const [file, setFile] = React.useState<File | null>(null);

  const { state, execute } = useFetch();
  const { isOpen, closeModal } = useModal();
  const t = useTranslations("Values");

  const data = {
    [ModalIds.ImportCitizens]: {
      docsUrl: "https://docs.snailycad.org/docs/developer/importing-values#citizens",
      title: "Import Citizen",
    },
    [ModalIds.ImportVehicles]: {
      docsUrl: "https://docs.snailycad.org/docs/developer/importing-values#vehicles",
      title: "Import Vehicles",
    },
    [ModalIds.ImportWeapons]: {
      docsUrl: "https://docs.snailycad.org/docs/developer/importing-values#weapons",
      title: "Import Weapons",
    },
  };

  async function onSubmit(_: any, helpers: FormikHelpers<typeof INITIAL_VALUES>) {
    const fd = new FormData();

    if (file?.size && file.name) {
      if (file.type !== "application/json") {
        helpers.setFieldError("file", "Only .json is supported");
        return;
      }

      fd.set("file", file, file.name);
    }

    const { json } = await execute<T>({
      path: url,
      method: "POST",
      data: fd,
    });

    if (Array.isArray(json)) {
      onImport(json);
      closeModal(id);
    }
  }

  const INITIAL_VALUES = {
    file: "",
  };

  return (
    <Modal
      className="w-[600px]"
      title={data[id].title}
      onClose={() => closeModal(id)}
      isOpen={isOpen(id)}
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

            <a className="underline" target="_blank" rel="noreferrer" href={data[id].docsUrl}>
              Documentation
            </a>

            <footer className="flex justify-end mt-5">
              <Button type="reset" onPress={() => closeModal(id)} variant="cancel">
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
