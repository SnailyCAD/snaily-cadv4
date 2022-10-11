import * as React from "react";
import { Loader, Button } from "@snailycad/ui";
import { FormField } from "components/form/FormField";
import { Modal } from "components/modal/Modal";
import { useModal } from "state/modalState";
import { Form, Formik, useFormikContext } from "formik";
import useFetch from "lib/useFetch";
import { ModalIds } from "types/ModalIds";
import { useTranslations } from "use-intl";
import { CustomFieldCategory, Citizen, RecordType, BoloType } from "@snailycad/types";
import { calculateAge, formatCitizenAddress } from "lib/utils";
import format from "date-fns/format";
import { NameSearchTabsContainer } from "./tabs/TabsContainer";
import { NameSearchResult, useNameSearch } from "state/search/nameSearchState";
import { normalizeValue } from "context/ValuesContext";
import { useRouter } from "next/router";
import { ArrowLeft, PersonFill } from "react-bootstrap-icons";
import { useImageUrl } from "hooks/useImageUrl";
import { useAuth } from "context/AuthContext";
import { useFeatureEnabled } from "hooks/useFeatureEnabled";
import { InputSuggestions } from "components/form/inputs/InputSuggestions";
import { Infofield } from "components/shared/Infofield";
import { CitizenLicenses } from "components/citizen/licenses/LicensesCard";
import { FullDate } from "components/shared/FullDate";
import dynamic from "next/dynamic";
import {
  LicenseInitialValues,
  ManageLicensesModal,
} from "components/citizen/licenses/ManageLicensesModal";
import { ManageCitizenFlagsModal } from "./ManageCitizenFlagsModal";
import { CitizenImageModal } from "components/citizen/modals/CitizenImageModal";
import { ManageCustomFieldsModal } from "./ManageCustomFieldsModal";
import { CustomFieldsArea } from "../CustomFieldsArea";
import { useBolos } from "hooks/realtime/useBolos";
import type {
  PostEmsFdDeclareCitizenById,
  PostLeoSearchCitizenData,
  PutSearchActionsLicensesData,
} from "@snailycad/types/api";
import Image from "next/future/image";

const VehicleSearchModal = dynamic(
  async () => (await import("components/leo/modals/VehicleSearchModal")).VehicleSearchModal,
);

const WeaponSearchModal = dynamic(
  async () => (await import("components/leo/modals/WeaponSearchModal")).WeaponSearchModal,
);

const CreateCitizenModal = dynamic(
  async () => (await import("./CreateCitizenModal")).CreateCitizenModal,
);

function AutoSubmit() {
  const { getPayload } = useModal();
  const payloadCitizen = getPayload<Citizen>(ModalIds.NameSearch);
  const { submitForm } = useFormikContext();

  // if there's a name, auto-submit the form.
  React.useEffect(() => {
    if (payloadCitizen) {
      submitForm();
    }
  }, [payloadCitizen, submitForm]);

  return null;
}

export function NameSearchModal() {
  const { isOpen, closeModal, getPayload } = useModal();
  const common = useTranslations("Common");
  const cT = useTranslations("Citizen");
  const vT = useTranslations("Vehicles");
  const t = useTranslations("Leo");
  const ems = useTranslations("Ems");
  const { state, execute } = useFetch();
  const router = useRouter();
  const { makeImageUrl } = useImageUrl();
  const { cad } = useAuth();
  const { SOCIAL_SECURITY_NUMBERS, CREATE_USER_CITIZEN_LEO } = useFeatureEnabled();
  const { bolos } = useBolos();

  const { openModal } = useModal();
  const isLeo = router.pathname === "/officer";
  const { results, currentResult, setCurrentResult, setResults } = useNameSearch();

  const payloadCitizen = getPayload<Citizen>(ModalIds.NameSearch);

  const bolo = React.useMemo(() => {
    if (!currentResult) return null;
    if (bolos.length <= 0) return null;

    const boloWithName = bolos.find((v) => {
      const name = `${currentResult.name} ${currentResult.surname}`.toLowerCase();
      return v.type === BoloType.PERSON && v.name?.toLowerCase() === name;
    });

    return boloWithName ?? null;
  }, [bolos, currentResult]);

  React.useEffect(() => {
    if (!isOpen(ModalIds.NameSearch)) {
      setResults(null);
      setCurrentResult(null);
    }
  }, [isOpen, setCurrentResult, setResults]);

  async function handleLicensesSubmit(values: LicenseInitialValues) {
    if (!currentResult) return;

    const { json } = await execute<PutSearchActionsLicensesData>({
      path: `/search/actions/licenses/${currentResult.id}`,
      method: "PUT",
      data: {
        ...values,
        driversLicenseCategory: values.driversLicenseCategory?.map((v) => v.value),
        pilotLicenseCategory: values.pilotLicenseCategory?.map((v) => v.value),
        waterLicenseCategory: values.waterLicenseCategory?.map((v) => v.value),
        firearmLicenseCategory: values.firearmLicenseCategory?.map((v) => v.value),
      },
    });

    if (json) {
      setCurrentResult({ ...currentResult, ...json });
      closeModal(ModalIds.ManageLicenses);
    }
  }

  async function onSubmit(values: typeof INITIAL_VALUES) {
    const { json, error } = await execute<PostLeoSearchCitizenData>({
      path: "/search/name",
      method: "POST",
      data: values,
    });
    if (error) return;

    if (Array.isArray(json) && json.length <= 0) {
      setResults(false);
      setCurrentResult(null);
      return;
    }

    const first = Array.isArray(json) ? json[0] : json;

    if (first && (first?.id === currentResult?.id || first?.id === payloadCitizen?.id)) {
      setCurrentResult(first);
    }

    if (json && typeof json !== "boolean") {
      setResults(Array.isArray(json) ? json : [json]);
    } else {
      setResults(false);
      setCurrentResult(null);
    }
  }

  async function handleDeclare() {
    if (!currentResult) return;

    const { json } = await execute<PostEmsFdDeclareCitizenById>({
      path: `/ems-fd/declare/${currentResult.id}`,
      method: "POST",
    });

    if (json.id) {
      setCurrentResult({ ...currentResult, ...json });
    }
  }

  function handleOpenCreateRecord(type: RecordType) {
    if (!currentResult) return;

    const modalId = {
      [RecordType.ARREST_REPORT]: ModalIds.CreateArrestReport,
      [RecordType.TICKET]: ModalIds.CreateTicket,
      [RecordType.WRITTEN_WARNING]: ModalIds.CreateWrittenWarning,
    };

    openModal(modalId[type], {
      citizenName: `${currentResult.name} ${currentResult.surname}`,
      citizenId: currentResult.id,
    });
  }

  const warrants = !currentResult || currentResult.isConfidential ? [] : currentResult.warrants;
  const hasActiveWarrants = warrants.filter((v) => v.status === "ACTIVE").length > 0;

  const INITIAL_VALUES = {
    name: payloadCitizen?.name ?? "",
    id: payloadCitizen?.id,
  };

  return (
    <Modal
      title={t("nameSearch")}
      onClose={() => closeModal(ModalIds.NameSearch)}
      isOpen={isOpen(ModalIds.NameSearch)}
      className="w-[850px]"
    >
      <Formik initialValues={INITIAL_VALUES} onSubmit={onSubmit}>
        {({ handleChange, setFieldValue, errors, values, isValid }) => (
          <Form>
            <FormField errorMessage={errors.name} label={cT("fullName")}>
              <InputSuggestions<NameSearchResult>
                onSuggestionPress={(suggestion: NameSearchResult) => {
                  setFieldValue("name", `${suggestion.name} ${suggestion.surname}`);
                  setCurrentResult(suggestion);
                }}
                Component={({ suggestion }) => (
                  <div className="flex items-center">
                    {suggestion.imageId ? (
                      <Image
                        alt={`${suggestion.name} ${suggestion.surname}`}
                        className="rounded-md w-[30px] h-[30px] object-cover mr-2"
                        draggable={false}
                        src={makeImageUrl("citizens", suggestion.imageId)!}
                        loading="lazy"
                        width={30}
                        height={30}
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
                  apiPath: "/search/name",
                  method: "POST",
                  dataKey: "name",
                  allowUnknown: true,
                }}
                inputProps={{
                  value: values.name,
                  name: "name",
                  onChange: handleChange,
                }}
              />
            </FormField>

            {typeof results === "boolean" ? (
              <div className="mt-5">
                <p>{t("nameNotFound")}</p>
              </div>
            ) : null}

            {Array.isArray(results) && !currentResult ? (
              <ul className="space-y-2">
                {results.map((result) => (
                  <li className="flex items-center justify-between" key={result.id}>
                    <div className="flex items-center">
                      <div className="mr-2 min-w-[50px]">
                        {result.imageId ? (
                          <Image
                            className="rounded-md w-[50px] h-[50px] object-cover"
                            draggable={false}
                            src={makeImageUrl("citizens", result.imageId)!}
                            loading="lazy"
                            width={50}
                            height={50}
                            alt={`${result.name} ${result.surname}`}
                          />
                        ) : (
                          <PersonFill className="text-gray-500/60 w-[50px] h-[50px]" />
                        )}
                      </div>
                      <p>
                        {result.name} {result.surname}{" "}
                        {SOCIAL_SECURITY_NUMBERS && result.socialSecurityNumber ? (
                          <>(SSN: {result.socialSecurityNumber})</>
                        ) : null}
                      </p>
                    </div>

                    <Button type="button" onPress={() => setCurrentResult(result)}>
                      {common("view")}
                    </Button>
                  </li>
                ))}
              </ul>
            ) : null}

            {currentResult ? (
              currentResult.isConfidential ? (
                <p className="my-5 px-2">{t("citizenIsConfidential")}</p>
              ) : (
                <div className="mt-3">
                  <header className="flex justify-between mb-5">
                    <h3 className="text-2xl font-semibold">{t("results")}</h3>

                    <div>
                      <Button
                        className="flex items-center justify-between gap-2"
                        type="button"
                        onPress={() => setCurrentResult(null)}
                      >
                        <ArrowLeft />
                        {t("viewAllResults")}
                      </Button>
                    </div>
                  </header>

                  {currentResult.dead && currentResult.dateOfDead ? (
                    <div className="p-2 my-2 font-semibold text-black rounded-md bg-amber-500">
                      {t("citizenDead", {
                        date: format(
                          new Date(currentResult.dateOfDead ?? new Date()),
                          "MMMM do yyyy",
                        ),
                      })}
                    </div>
                  ) : null}

                  {bolo ? (
                    <div className="p-2 my-2 font-semibold text-black rounded-md bg-amber-500">
                      {t("citizenBoloPlaced")}
                    </div>
                  ) : null}

                  {hasActiveWarrants ? (
                    <div className="p-2 my-2 font-semibold bg-red-700 rounded-md">
                      {t("hasWarrants")}
                    </div>
                  ) : null}

                  <div className="flex flex-col md:flex-row">
                    <div className="mr-2 min-w-[100px]">
                      {currentResult.imageId ? (
                        <button
                          type="button"
                          onClick={() => openModal(ModalIds.CitizenImage)}
                          className="cursor-pointer"
                        >
                          <Image
                            className="rounded-md w-[100px] h-[100px] object-cover"
                            draggable={false}
                            src={makeImageUrl("citizens", currentResult.imageId)!}
                            loading="lazy"
                            width={100}
                            height={100}
                            alt={`${currentResult.name} ${currentResult.surname}`}
                          />
                        </button>
                      ) : (
                        <PersonFill className="text-gray-500/60 w-[100px] h-[100px]" />
                      )}
                    </div>
                    <div className="w-full">
                      <div className="flex flex-col">
                        <Infofield label={cT("fullName")}>
                          {currentResult.name} {currentResult.surname}
                        </Infofield>

                        {SOCIAL_SECURITY_NUMBERS && currentResult.socialSecurityNumber ? (
                          <Infofield label={cT("socialSecurityNumber")}>
                            {currentResult.socialSecurityNumber}
                          </Infofield>
                        ) : null}

                        <Infofield label={cT("dateOfBirth")}>
                          <FullDate isDateOfBirth onlyDate>
                            {currentResult.dateOfBirth}
                          </FullDate>{" "}
                          ({cT("age")}: {calculateAge(currentResult.dateOfBirth)})
                        </Infofield>

                        <Infofield label={cT("gender")}>{currentResult.gender.value}</Infofield>
                        <Infofield label={cT("ethnicity")}>
                          {currentResult.ethnicity.value}
                        </Infofield>
                        <Infofield label={cT("hairColor")}>{currentResult.hairColor}</Infofield>
                        <Infofield label={cT("eyeColor")}>{currentResult.eyeColor}</Infofield>
                      </div>

                      <div className="flex flex-col">
                        <Infofield label={cT("weight")}>
                          {currentResult.weight} {cad?.miscCadSettings?.weightPrefix}
                        </Infofield>

                        <Infofield label={cT("height")}>
                          {currentResult.height} {cad?.miscCadSettings?.heightPrefix}
                        </Infofield>

                        <Infofield label={cT("address")}>
                          {formatCitizenAddress(currentResult)}
                        </Infofield>

                        <Infofield label={cT("phoneNumber")}>
                          {currentResult.phoneNumber || common("none")}
                        </Infofield>

                        <Infofield className="max-w-[400px]" label={cT("occupation")}>
                          {currentResult.occupation || common("none")}
                        </Infofield>

                        <Infofield className="max-w-[400px]" label={cT("additionalInfo")}>
                          {currentResult.additionalInfo || common("none")}
                        </Infofield>
                      </div>
                    </div>

                    <div className="w-full">
                      <div>
                        <ul className="flex flex-col">
                          <CitizenLicenses citizen={currentResult} />
                        </ul>

                        {isLeo ? (
                          <Button
                            size="xs"
                            type="button"
                            className="mt-2"
                            onPress={() => openModal(ModalIds.ManageLicenses)}
                          >
                            {t("editLicenses")}
                          </Button>
                        ) : null}
                      </div>

                      <div className="mt-4">
                        <Infofield label={vT("flags")}>
                          {currentResult.flags?.map((v) => v.value).join(", ") || common("none")}
                        </Infofield>

                        {isLeo ? (
                          <Button
                            size="xs"
                            type="button"
                            className="mt-2"
                            onPress={() => openModal(ModalIds.ManageCitizenFlags)}
                          >
                            {t("manageCitizenFlags")}
                          </Button>
                        ) : null}
                      </div>

                      <CustomFieldsArea currentResult={currentResult} isLeo={isLeo} />
                    </div>
                  </div>

                  <div className="mt-5">
                    <NameSearchTabsContainer />
                  </div>
                </div>
              )
            ) : null}

            <footer
              className={`mt-4 pt-3 flex ${
                (currentResult || CREATE_USER_CITIZEN_LEO) && isLeo
                  ? "justify-between"
                  : "justify-end"
              }`}
            >
              <div>
                {CREATE_USER_CITIZEN_LEO ? (
                  <Button type="button" onPress={() => openModal(ModalIds.CreateCitizen)}>
                    {t("createCitizen")}
                  </Button>
                ) : null}
                {currentResult && !currentResult.isConfidential && isLeo ? (
                  <>
                    {Object.values(RecordType).map((type) => (
                      <Button
                        key={type}
                        type="button"
                        onPress={() => handleOpenCreateRecord(type)}
                        variant="cancel"
                        className="px-1.5"
                      >
                        {t(normalizeValue(`CREATE_${type}`))}
                      </Button>
                    ))}

                    <Button
                      size="xs"
                      type="button"
                      onPress={handleDeclare}
                      disabled={state === "loading"}
                      variant="cancel"
                      className="px-1.5"
                    >
                      {currentResult.dead ? ems("declareAlive") : ems("declareDead")}
                    </Button>
                  </>
                ) : null}
              </div>

              <div className="flex">
                <Button
                  type="reset"
                  onPress={() => closeModal(ModalIds.NameSearch)}
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
              </div>
            </footer>

            <AutoSubmit />
            <VehicleSearchModal id={ModalIds.VehicleSearchWithinName} />
            <WeaponSearchModal id={ModalIds.WeaponSearchWithinName} />
            {CREATE_USER_CITIZEN_LEO && isLeo ? <CreateCitizenModal /> : null}
            {currentResult && !currentResult.isConfidential ? (
              <>
                <ManageCitizenFlagsModal />
                <ManageCustomFieldsModal
                  category={CustomFieldCategory.CITIZEN}
                  url={`/search/actions/custom-fields/citizen/${currentResult.id}`}
                  allCustomFields={currentResult.allCustomFields ?? []}
                  customFields={currentResult.customFields ?? []}
                  onUpdate={(results) => setCurrentResult({ ...currentResult, ...results })}
                />
                <ManageLicensesModal
                  allowRemoval={false}
                  state={state}
                  onSubmit={handleLicensesSubmit}
                  citizen={currentResult}
                  isLeo
                />
                <CitizenImageModal citizen={currentResult} />
              </>
            ) : null}
          </Form>
        )}
      </Formik>
    </Modal>
  );
}
