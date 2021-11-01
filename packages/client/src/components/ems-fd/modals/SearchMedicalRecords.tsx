import * as React from "react";
import { useTranslations } from "use-intl";
import { Formik } from "formik";
import { Button } from "components/Button";
import { Error } from "components/form/Error";
import { FormField } from "components/form/FormField";
import { Loader } from "components/Loader";
import { Modal } from "components/modal/Modal";
import useFetch from "lib/useFetch";
import { useModal } from "context/ModalContext";
import { ModalIds } from "types/ModalIds";
import type { Citizen, MedicalRecord } from "types/prisma";
import { Input } from "components/form/Input";

interface Props {
  onClose?: () => void;
}

export const SearchMedicalRecordModal = ({ onClose }: Props) => {
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
            <FormField fieldId="name" label={t("citizen")}>
              <Input
                required
                hasError={!!errors.name}
                onChange={handleChange}
                id="name"
                value={values.name}
              />
              <Error>{errors.name}</Error>
            </FormField>

            {typeof results === "boolean" && results !== null ? (
              <p>{ems("citizenNoMedicalRecords")}</p>
            ) : null}

            {typeof results !== "boolean" && results !== null ? (
              <>
                <div className="overflow-x-auto w-full mt-3">
                  <table className="overflow-hidden max-w-4xl w-full whitespace-nowrap max-h-64">
                    <thead>
                      <tr>
                        <th>{t("diseases")}</th>
                        <th>{t("bloodGroup")}</th>
                        <th>{common("description")}</th>
                        <th>{common("actions")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {results.medicalRecords.map((record) => (
                        <tr key={record.id}>
                          <td>{record.type}</td>
                          <td>{record.bloodGroup?.value ?? common("none")}</td>
                          <td>{record.description}</td>
                          <td className="w-[30%]">
                            <Button
                              small
                              variant={results.dead ? "success" : "danger"}
                              type="button"
                              onClick={handleDeclare}
                              className=""
                            >
                              {results.dead ? "Declare Alive" : "Declare dead"}
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            ) : null}

            <footer className="mt-5 flex justify-end">
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
};

interface SearchResult extends Citizen {
  medicalRecords: MedicalRecord[];
}
