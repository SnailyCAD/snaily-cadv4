import * as React from "react";
import { useTranslations } from "use-intl";
import { Formik } from "formik";
import { Button } from "components/Button";
import { FormField } from "components/form/FormField";
import { Loader } from "components/Loader";
import { Modal } from "components/modal/Modal";
import useFetch from "lib/useFetch";
import { useModal } from "context/ModalContext";
import { ModalIds } from "types/ModalIds";
import type { Citizen, MedicalRecord } from "@snailycad/types";
import { Input } from "components/form/inputs/Input";
import { Table } from "components/shared/Table";

interface Props {
  onClose?(): void;
}

export function SearchMedicalRecordModal({ onClose }: Props) {
  const { state, execute } = useFetch();
  const { isOpen, closeModal } = useModal();
  const common = useTranslations("Common");
  const t = useTranslations("MedicalRecords");
  const ems = useTranslations("Ems");

  const [results, setResults] = React.useState<SearchResult | null | boolean>(null);

  function handleClose() {
    closeModal(ModalIds.SearchMedicalRecord);
    onClose?.();
  }

  async function handleDeclare() {
    if (!results || typeof results === "boolean") return;

    const { json } = await execute(`/ems-fd/declare/${results.id}`, {
      method: "POST",
    });

    if (json.id) {
      setResults({ ...results, ...json });
    }
  }

  async function onSubmit(values: typeof INITIAL_VALUES) {
    const { json } = await execute("/search/medical-records", {
      method: "POST",
      data: values,
      noToast: true,
    });

    if (json.id || json?.medicalRecords?.length > 0) {
      setResults(json);
    } else {
      setResults(false);
    }
  }

  const INITIAL_VALUES = {
    name: "",
  };

  React.useEffect(() => {
    if (!isOpen(ModalIds.SearchMedicalRecord)) {
      setResults(null);
    }
  }, [isOpen]);

  return (
    <Modal
      title={ems("searchMedicalRecord")}
      onClose={handleClose}
      isOpen={isOpen(ModalIds.SearchMedicalRecord)}
      className="w-[750px]"
    >
      <Formik onSubmit={onSubmit} initialValues={INITIAL_VALUES}>
        {({ handleSubmit, handleChange, errors, values, isValid }) => (
          <form onSubmit={handleSubmit}>
            <FormField errorMessage={errors.name} label={t("citizen")}>
              <Input required onChange={handleChange} name="name" value={values.name} />
            </FormField>

            {typeof results === "boolean" ? <p>{ems("citizenNoMedicalRecords")}</p> : null}

            {typeof results !== "boolean" && results !== null ? (
              <Table
                data={results.medicalRecords.map((record) => ({
                  type: record.type,
                  bloodGroup: record.bloodGroup?.value ?? common("none"),
                  description: record.description,
                  actions: (
                    <Button
                      small
                      variant={results.dead ? "success" : "danger"}
                      type="button"
                      onClick={handleDeclare}
                      className=""
                    >
                      {results.dead ? "Declare Alive" : "Declare dead"}
                    </Button>
                  ),
                }))}
                columns={[
                  { Header: t("diseases"), accessor: "type" },
                  { Header: t("bloodGroup"), accessor: "bloodGroup" },
                  { Header: t("description"), accessor: "description" },
                  { Header: common("actions"), accessor: "actions" },
                ]}
              />
            ) : null}

            <footer className="flex justify-end mt-5">
              <Button
                type="reset"
                onClick={() => closeModal(ModalIds.SearchMedicalRecord)}
                variant="cancel"
              >
                {common("cancel")}
              </Button>
              <Button
                className="flex items-center"
                disabled={!isValid || state === "loading"}
                type="submit"
              >
                {state === "loading" ? <Loader className="mr-2" /> : null}
                {common("search")}
              </Button>
            </footer>
          </form>
        )}
      </Formik>
    </Modal>
  );
}

interface SearchResult extends Citizen {
  medicalRecords: MedicalRecord[];
}
