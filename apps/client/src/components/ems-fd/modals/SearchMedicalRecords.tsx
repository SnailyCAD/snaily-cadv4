import * as React from "react";
import { useTranslations } from "use-intl";
import { Form, Formik } from "formik";
import { Loader, Button, Item, AsyncListSearchField } from "@snailycad/ui";
import { Modal } from "components/modal/Modal";
import useFetch from "lib/useFetch";
import { useModal } from "state/modalState";
import { ModalIds } from "types/ModalIds";
import { Table, useTableState } from "components/shared/Table";
import { useFeatureEnabled } from "hooks/useFeatureEnabled";
import { PersonFill } from "react-bootstrap-icons";
import { Infofield } from "components/shared/Infofield";
import { FullDate } from "components/shared/FullDate";
import { calculateAge, formatCitizenAddress } from "lib/utils";
import { useAuth } from "context/AuthContext";
import { CitizenImageModal } from "components/citizen/modals/CitizenImageModal";
import type {
  PostEmsFdDeclareCitizenById,
  PostEmsFdMedicalRecordsSearchData,
} from "@snailycad/types/api";
import { classNames } from "lib/classNames";
import format from "date-fns/format";
import { useImageUrl } from "hooks/useImageUrl";
import { SpeechAlert } from "components/leo/modals/NameSearchModal/speech-alert";
import { ImageWrapper } from "components/shared/image-wrapper";

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
  const tableState = useTableState();

  const [results, setResults] = React.useState<SearchResult | null | undefined>(undefined);

  function handleClose() {
    closeModal(ModalIds.SearchMedicalRecord);
    onClose?.();
  }

  async function handleDeclare() {
    if (!results || typeof results === "boolean") return;

    const { json } = await execute<PostEmsFdDeclareCitizenById>({
      path: `/ems-fd/declare/${results.id}`,
      method: "POST",
    });

    if (json.id) {
      setResults({ ...results, ...json });
    }
  }

  async function onSubmit(values: typeof INITIAL_VALUES) {
    const { json } = await execute<PostEmsFdMedicalRecordsSearchData>({
      path: "/search/medical-records",
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
    searchValue: "",
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
        {({ setValues, errors, values, isValid }) => (
          <Form>
            <AsyncListSearchField<SearchResult>
              autoFocus
              setValues={({ localValue, node }) => {
                const searchValue =
                  typeof localValue !== "undefined" ? { searchValue: localValue } : {};
                const name = node ? { name: node.key as string } : {};

                if (node) {
                  handleFoundName(node.value);
                }

                setValues({ ...values, ...searchValue, ...name });
              }}
              localValue={values.searchValue}
              errorMessage={errors.name}
              label={t("Common.citizen")}
              selectedKey={values.name}
              fetchOptions={{
                apiPath: "/search/name?includeMany=true",
                method: "POST",
                bodyKey: "name",
                filterTextRequired: true,
              }}
            >
              {(item) => {
                const name = `${item.name} ${item.surname}`;

                return (
                  <Item key={item.id} textValue={name}>
                    <div className="flex items-center">
                      {item.imageId ? (
                        <ImageWrapper
                          quality={70}
                          placeholder={item.imageBlurData ? "blur" : "empty"}
                          blurDataURL={item.imageBlurData ?? undefined}
                          alt={`${item.name} ${item.surname}`}
                          className="rounded-md w-[30px] h-[30px] object-cover mr-2"
                          draggable={false}
                          src={makeImageUrl("citizens", item.imageId)!}
                          loading="lazy"
                          width={30}
                          height={30}
                        />
                      ) : null}
                      <p>
                        {name}{" "}
                        {SOCIAL_SECURITY_NUMBERS && item.socialSecurityNumber ? (
                          <>(SSN: {item.socialSecurityNumber})</>
                        ) : null}
                      </p>
                    </div>
                  </Item>
                );
              }}
            </AsyncListSearchField>

            {typeof results === "undefined" ? null : results === null ? (
              <p>{t("Errors.citizenNotFound")}</p>
            ) : results.isConfidential ? (
              <p className="my-5 px-2">{t("Leo.citizenIsConfidential")}</p>
            ) : (
              <>
                {results.dead && results.dateOfDead ? (
                  <SpeechAlert
                    text={t("Leo.citizenDead", {
                      date: format(new Date(results.dateOfDead), "MMMM do yyyy"),
                    })}
                  >
                    <div className="p-2 my-2 font-semibold text-black rounded-md bg-amber-500">
                      {t("Leo.citizenDead", {
                        date: format(new Date(results.dateOfDead), "MMMM do yyyy"),
                      })}
                    </div>
                  </SpeechAlert>
                ) : null}

                {results.missing && results.dateOfMissing ? (
                  <SpeechAlert
                    text={t("citizenMissing", {
                      date: format(new Date(results.dateOfMissing), "MMMM do yyyy"),
                    })}
                  >
                    <div className="p-2 my-2 font-semibold text-black rounded-md bg-amber-500">
                      {t("citizenMissing", {
                        date: format(new Date(results.dateOfMissing), "MMMM do yyyy"),
                      })}
                    </div>
                  </SpeechAlert>
                ) : null}

                <div className="flex w-full">
                  <div className="mr-2 min-w-[100px]">
                    {results.imageId ? (
                      <button
                        type="button"
                        onClick={() => openModal(ModalIds.CitizenImage)}
                        className="cursor-pointer"
                      >
                        <ImageWrapper
                          quality={70}
                          placeholder={results.imageBlurData ? "blur" : "empty"}
                          blurDataURL={results.imageBlurData ?? undefined}
                          className="rounded-md w-[100px] h-[100px] object-cover"
                          draggable={false}
                          src={makeImageUrl("citizens", results.imageId)!}
                          loading="lazy"
                          width={100}
                          height={100}
                          alt={`${results.name} ${results.surname}`}
                        />
                      </button>
                    ) : (
                      <PersonFill className="text-gray-500/60 w-[100px] h-[100px]" />
                    )}
                  </div>
                  <div className="w-full overflow-y-auto">
                    <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-y-1 md:gap-y-0 md:gap-5">
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
                        <Infofield label={t("Citizen.gender")}>
                          {results.gender?.value ?? t("Common.none")}
                        </Infofield>
                        <Infofield label={t("Citizen.ethnicity")}>
                          {results.ethnicity?.value ?? t("Common.none")}
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
                        <Infofield className="max-w-[400px]" label={t("Citizen.additionalInfo")}>
                          {results.additionalInfo || t("Common.none")}
                        </Infofield>
                      </div>
                    </div>
                    <div className="mt-7">
                      {results.medicalRecords.length <= 0 ? (
                        <p>No medical records</p>
                      ) : (
                        <Table
                          features={{ isWithinCardOrModal: true }}
                          tableState={tableState}
                          data={results.medicalRecords.map((record) => ({
                            id: record.id,
                            type: record.type,
                            bloodGroup: record.bloodGroup?.value ?? t("Common.none"),
                            description: record.description || t("Common.none"),
                            actions: (
                              <Button
                                size="xs"
                                variant={results.dead ? "success" : "danger"}
                                type="button"
                                onPress={handleDeclare}
                                disabled={state === "loading"}
                              >
                                {results.dead ? t("Ems.declareAlive") : t("Ems.declareDead")}
                              </Button>
                            ),
                          }))}
                          columns={[
                            { header: t("MedicalRecords.diseases"), accessorKey: "type" },
                            { header: t("MedicalRecords.bloodGroup"), accessorKey: "bloodGroup" },
                            { header: t("Common.description"), accessorKey: "description" },
                            { header: t("Common.actions"), accessorKey: "actions" },
                          ]}
                        />
                      )}
                    </div>
                  </div>
                  <CitizenImageModal citizen={results} />
                </div>
              </>
            )}

            <footer
              className={classNames(
                "flex justify-end mt-5",
                results && !results.isConfidential && "justify-between",
              )}
            >
              {results && !results.isConfidential ? (
                <Button
                  size="xs"
                  type="button"
                  onPress={handleDeclare}
                  disabled={state === "loading"}
                  variant="cancel"
                  className="px-1.5"
                >
                  {results.dead ? t("Ems.declareAlive") : t("Ems.declareDead")}
                </Button>
              ) : null}

              <div className="flex gap-2">
                <Button
                  type="reset"
                  onPress={() => closeModal(ModalIds.SearchMedicalRecord)}
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
              </div>
            </footer>
          </Form>
        )}
      </Formik>
    </Modal>
  );
}

type SearchResult = PostEmsFdMedicalRecordsSearchData;
