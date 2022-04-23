import * as React from "react";
import { useTranslations } from "use-intl";
import { Form, Formik } from "formik";
import { Button } from "components/Button";
import { FormField } from "components/form/FormField";
import { Loader } from "components/Loader";
import { Modal } from "components/modal/Modal";
import useFetch from "lib/useFetch";
import { useModal } from "state/modalState";
import { ModalIds } from "types/ModalIds";
import type { Citizen, MedicalRecord } from "@snailycad/types";
import { Table } from "components/shared/Table";
import { InputSuggestions } from "components/form/inputs/InputSuggestions";
import { useImageUrl } from "hooks/useImageUrl";
import { useFeatureEnabled } from "hooks/useFeatureEnabled";

interface Props {
  onClose?(): void;
}

export function SearchMedicalRecordModal({ onClose }: Props) {
  const { state, execute } = useFetch();
  const { isOpen, closeModal } = useModal();
  const t = useTranslations();
  const { makeImageUrl } = useImageUrl();
  const { SOCIAL_SECURITY_NUMBERS } = useFeatureEnabled();

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

    handleFoundName(json);
  }

  function handleFoundName(data: SearchResult | null) {
    if (!data?.id) {
      return setResults(false);
    }

    setResults(data);
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
      title={t("Ems.searchMedicalRecord")}
      onClose={handleClose}
      isOpen={isOpen(ModalIds.SearchMedicalRecord)}
      className="w-[750px]"
    >
      <Formik onSubmit={onSubmit} initialValues={INITIAL_VALUES}>
        {({ setFieldValue, handleChange, errors, values, isValid }) => (
          <Form>
            <FormField errorMessage={errors.name} label={t("MedicalRecords.citizen")}>
              <InputSuggestions
                onSuggestionClick={(suggestion: SearchResult) => {
                  setFieldValue("name", `${suggestion.name} ${suggestion.surname}`);
                  handleFoundName(suggestion);
                }}
                Component={({ suggestion }: { suggestion: Citizen }) => (
                  <div className="flex items-center">
                    {suggestion.imageId ? (
                      <img
                        className="rounded-md w-[30px] h-[30px] object-cover mr-2"
                        draggable={false}
                        src={makeImageUrl("citizens", suggestion.imageId)}
                      />
                    ) : null}
                    <p>
                      {suggestion.name} {suggestion.surname}{" "}
                      {SOCIAL_SECURITY_NUMBERS && suggestion.socialSecurityNumber ? (
                        <>(SSN: {suggestion.socialSecurityNumber})</>
                      ) : null}
                    </p>
                  </div>
                )}
                options={{
                  apiPath: "/search/medical-name",
                  method: "POST",
                  dataKey: "name",
                }}
                inputProps={{
                  value: values.name,
                  name: "name",
                  onChange: handleChange,
                }}
              />
            </FormField>

            {typeof results !== "boolean" && results && results.medicalRecords.length <= 0 ? (
              <div className="flex items-center justify-between my-5">
                <p>{t("Ems.citizenNoMedicalRecords")}</p>
                <Button
                  small
                  variant={results.dead ? "success" : "danger"}
                  type="button"
                  onClick={handleDeclare}
                  disabled={state === "loading"}
                  className="mt-2"
                >
                  {results.dead ? t("Ems.declareAlive") : t("Ems.declareDead")}
                </Button>
              </div>
            ) : null}

            {typeof results === "boolean" && !results ? <p>{t("Errors.citizenNotFound")}</p> : null}

            {typeof results !== "boolean" && results && results.medicalRecords.length >= 1 ? (
              <Table
                data={results.medicalRecords.map((record) => ({
                  type: record.type,
                  bloodGroup: record.bloodGroup?.value ?? t("Common.none"),
                  description: record.description || t("Common.none"),
                  actions: (
                    <Button
                      small
                      variant={results.dead ? "success" : "danger"}
                      type="button"
                      onClick={handleDeclare}
                      disabled={state === "loading"}
                    >
                      {results.dead ? t("Ems.declareAlive") : t("Ems.declareDead")}
                    </Button>
                  ),
                }))}
                columns={[
                  { Header: t("MedicalRecords.diseases"), accessor: "type" },
                  { Header: t("MedicalRecords.bloodGroup"), accessor: "bloodGroup" },
                  { Header: t("Common.description"), accessor: "description" },
                  { Header: t("Common.actions"), accessor: "actions" },
                ]}
              />
            ) : null}

            <footer className="flex justify-end mt-5">
              <Button
                type="reset"
                onClick={() => closeModal(ModalIds.SearchMedicalRecord)}
                variant="cancel"
              >
                {t("Common.cancel")}
              </Button>
              <Button
                className="flex items-center"
                disabled={!isValid || state === "loading"}
                type="submit"
              >
                {state === "loading" ? <Loader className="mr-2" /> : null}
                {t("Common.search")}
              </Button>
            </footer>
          </Form>
        )}
      </Formik>
    </Modal>
  );
}

interface SearchResult extends Citizen {
  medicalRecords: MedicalRecord[];
}
