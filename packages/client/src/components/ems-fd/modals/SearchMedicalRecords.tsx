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
import { PersonFill } from "react-bootstrap-icons";
import { Infofield } from "components/shared/Infofield";
import { FullDate } from "components/shared/FullDate";
import { calculateAge, formatCitizenAddress } from "lib/utils";
import { useAuth } from "context/AuthContext";
import { CitizenImageModal } from "components/citizen/modals/CitizenImageModal";

interface Props {
  onClose?(): void;
}

export function SearchMedicalRecordModal({ onClose }: Props) {
  const { state, execute } = useFetch();
  const { isOpen, openModal, closeModal } = useModal();
  const t = useTranslations();
  const { makeImageUrl } = useImageUrl();
  const { SOCIAL_SECURITY_NUMBERS } = useFeatureEnabled();
  const { cad } = useAuth();

  const [results, setResults] = React.useState<SearchResult | null | undefined>(undefined);

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
      return setResults(null);
    }

    setResults(data);
  }

  const INITIAL_VALUES = {
    name: "",
  };

  React.useEffect(() => {
    if (!isOpen(ModalIds.SearchMedicalRecord)) {
      setResults(undefined);
    }
  }, [isOpen]);

  return (
    <Modal
      title={t("Ems.searchMedicalRecord")}
      onClose={handleClose}
      isOpen={isOpen(ModalIds.SearchMedicalRecord)}
      className="w-[850px]"
    >
      <Formik onSubmit={onSubmit} initialValues={INITIAL_VALUES}>
        {({ setFieldValue, handleChange, errors, values, isValid }) => (
          <Form>
            <FormField errorMessage={errors.name} label={t("MedicalRecords.citizen")}>
              <InputSuggestions<SearchResult>
                onSuggestionClick={(suggestion) => {
                  setFieldValue("name", `${suggestion.name} ${suggestion.surname}`);
                  handleFoundName(suggestion);
                }}
                Component={({ suggestion }) => (
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

            {typeof results === "undefined" ? null : results === null ? (
              <p>{t("Errors.citizenNotFound")}</p>
            ) : results.isConfidential ? (
              <p className="my-5 px-2">{t("Leo.citizenIsConfidential")}</p>
            ) : (
              <div className="flex w-full">
                <div className="mr-2 min-w-[100px]">
                  {results.imageId ? (
                    <button
                      type="button"
                      onClick={() => openModal(ModalIds.CitizenImage)}
                      className="cursor-pointer"
                    >
                      <img
                        className="rounded-md w-[100px] h-[100px] object-cover"
                        draggable={false}
                        src={makeImageUrl("citizens", results.imageId)}
                      />
                    </button>
                  ) : (
                    <PersonFill className="text-gray-500/60 w-[100px] h-[100px]" />
                  )}
                </div>
                <div className="w-full overflow-y-auto">
                  <div className="w-full grid grid-cols-2 gap-5">
                    <div>
                      <Infofield label={t("Citizen.fullName")}>
                        {results.name} {results.surname}
                      </Infofield>
                      {SOCIAL_SECURITY_NUMBERS && results.socialSecurityNumber ? (
                        <Infofield label={t("Citizen.socialSecurityNumber")}>
                          {results.socialSecurityNumber}
                        </Infofield>
                      ) : null}
                      <Infofield label={t("Citizen.dateOfBirth")}>
                        <FullDate isDateOfBirth onlyDate>
                          {results.dateOfBirth}
                        </FullDate>{" "}
                        ({t("Citizen.age")}: {calculateAge(results.dateOfBirth)})
                      </Infofield>
                      <Infofield label={t("Citizen.gender")}>{results.gender.value}</Infofield>
                      <Infofield label={t("Citizen.ethnicity")}>
                        {results.ethnicity.value}
                      </Infofield>
                      <Infofield label={t("Citizen.hairColor")}>{results.hairColor}</Infofield>
                      <Infofield label={t("Citizen.eyeColor")}>{results.eyeColor}</Infofield>
                    </div>
                    <div>
                      <Infofield label={t("Citizen.weight")}>
                        {results.weight} {cad?.miscCadSettings?.weightPrefix}
                      </Infofield>
                      <Infofield label={t("Citizen.height")}>
                        {results.height} {cad?.miscCadSettings?.heightPrefix}
                      </Infofield>
                      <Infofield label={t("Citizen.address")}>
                        {formatCitizenAddress(results)}
                      </Infofield>
                      <Infofield label={t("Citizen.phoneNumber")}>
                        {results.phoneNumber || t("Common.none")}
                      </Infofield>
                      <Infofield className="max-w-[400px]" label={t("Citizen.occupation")}>
                        {results.occupation || t("Common.none")}
                      </Infofield>
                    </div>
                  </div>

                  <div className="mt-7">
                    {results.medicalRecords.length <= 0 ? (
                      <p>No medical records</p>
                    ) : (
                      <Table
                        data={results.medicalRecords.map((record) => ({
                          type: record.type,
                          bloodGroup: record.bloodGroup?.value ?? t("Common.none"),
                          description: record.description || t("Common.none"),
                          actions: (
                            <Button
                              size="xs"
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
                    )}
                  </div>
                </div>

                <CitizenImageModal citizen={results} />
              </div>
            )}

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
  isConfidential?: boolean;
}
