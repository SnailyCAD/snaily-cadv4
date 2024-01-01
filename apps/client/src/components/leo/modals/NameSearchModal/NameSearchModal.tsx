import * as React from "react";
import { Button, AsyncListSearchField, Item, Infofield } from "@snailycad/ui";
import { Modal } from "components/modal/Modal";
import { useModal } from "state/modalState";
import { Form, Formik, useFormikContext } from "formik";
import useFetch from "lib/useFetch";
import { ModalIds } from "types/modal-ids";
import { useTranslations } from "use-intl";
import { CustomFieldCategory, type Citizen, BoloType } from "@snailycad/types";
import format from "date-fns/format";
import { NameSearchTabsContainer } from "./tabs/tabs-container";
import { type NameSearchResult, useNameSearch } from "state/search/name-search-state";
import { useRouter } from "next/router";
import { ArrowLeft, PersonFill } from "react-bootstrap-icons";
import { useImageUrl } from "hooks/useImageUrl";
import { useFeatureEnabled } from "hooks/useFeatureEnabled";
import dynamic from "next/dynamic";
import {
  type LicenseInitialValues,
  ManageLicensesModal,
} from "components/citizen/licenses/manage-licenses-modal";
import { ManageCitizenFlagsModal } from "./ManageCitizenFlagsModal";
import { CitizenImageModal } from "components/citizen/modals/citizen-image-modal";
import { ManageCustomFieldsModal } from "./ManageCustomFieldsModal";
import { useBolos } from "hooks/realtime/useBolos";
import type { PostLeoSearchCitizenData, PutSearchActionsLicensesData } from "@snailycad/types/api";
import { NameSearchBasicInformation } from "./sections/basic-information";
import { NameSearchLicensesSection } from "./sections/licenses-section";
import { NameSearchFooter } from "./sections/footer";
import { SpeechAlert } from "./speech-alert";
import { ImageWrapper } from "components/shared/image-wrapper";
import { ManageLicensePointsModal } from "./sections/license-points/manage-license-points-modal";
import { Permissions, usePermission } from "hooks/usePermission";

const VehicleSearchModal = dynamic(
  async () => (await import("components/leo/modals/VehicleSearchModal")).VehicleSearchModal,
);

const WeaponSearchModal = dynamic(
  async () => (await import("components/leo/modals/weapon-search-modal")).WeaponSearchModal,
);

const CreateOrManageCitizenModal = dynamic(
  async () => (await import("./CreateCitizenModal")).CreateOrManageCitizenModal,
);

const ManageCitizenAddressFlagsModal = dynamic(
  async () => (await import("./manage-citizen-address-flags-modal")).ManageCitizenAddressFlagsModal,
);

function AutoSubmit() {
  const modalState = useModal();
  const payloadCitizen = modalState.getPayload<Citizen>(ModalIds.NameSearch);
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
  const modalState = useModal();
  const common = useTranslations("Common");
  const cT = useTranslations("Citizen");
  const vT = useTranslations("Vehicles");
  const t = useTranslations("Leo");
  const { state, execute } = useFetch();
  const router = useRouter();
  const { makeImageUrl } = useImageUrl();
  const { SOCIAL_SECURITY_NUMBERS, CREATE_USER_CITIZEN_LEO, LEO_EDITABLE_CITIZEN_PROFILE } =
    useFeatureEnabled();
  const { bolos } = useBolos();
  const { hasPermissions } = usePermission();

  const hasManageCitizenProfilePermissions = hasPermissions([Permissions.LeoManageCitizenProfile]);
  const isLeo = router.pathname === "/officer";
  const isDispatch = router.pathname === "/dispatch";

  const { results, currentResult, setCurrentResult, setResults } = useNameSearch((state) => ({
    results: state.results,
    currentResult: state.currentResult,
    setCurrentResult: state.setCurrentResult,
    setResults: state.setResults,
  }));

  const payloadCitizen = modalState.getPayload<Citizen>(ModalIds.NameSearch);

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
    if (!modalState.isOpen(ModalIds.NameSearch)) {
      setResults(null);
      setCurrentResult(null);
    }
  }, [modalState, setCurrentResult, setResults]);

  async function handleLicensesSubmit(values: LicenseInitialValues) {
    if (!currentResult) return;

    const { json } = await execute<PutSearchActionsLicensesData>({
      path: `/search/actions/licenses/${currentResult.id}`,
      method: "PUT",
      data: values,
    });

    if (json) {
      setCurrentResult({ ...currentResult, ...json });
      modalState.closeModal(ModalIds.ManageLicenses);
    }
  }

  async function onSubmit(values: typeof INITIAL_VALUES) {
    const { json, error } = await execute<PostLeoSearchCitizenData>({
      path: "/search/name",
      method: "POST",
      data: { name: values.name || values.searchValue, id: values.id },
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

  const warrants =
    !currentResult || currentResult.isConfidential ? [] : currentResult.warrants ?? [];
  const hasActiveWarrants = warrants.filter((v) => v.status === "ACTIVE").length > 0;

  const INITIAL_VALUES = {
    searchValue: payloadCitizen?.name ?? "",
    name: payloadCitizen?.name ?? "",
    id: payloadCitizen?.id,
  };

  return (
    <Modal
      title={t("nameSearch")}
      onClose={() => modalState.closeModal(ModalIds.NameSearch)}
      isOpen={modalState.isOpen(ModalIds.NameSearch)}
      className={currentResult ? "w-[1200px]" : "w-[650px]"}
    >
      <Formik initialValues={INITIAL_VALUES} onSubmit={onSubmit}>
        {({ setValues, setFieldValue, errors, values }) => (
          <Form>
            <AsyncListSearchField<NameSearchResult>
              autoFocus
              allowsCustomValue
              onInputChange={(value) => setFieldValue("searchValue", value)}
              onSelectionChange={(node) => {
                if (node) {
                  setCurrentResult(node.value);
                }

                setValues({
                  ...values,
                  searchValue: node?.textValue ?? "",
                  name: node?.textValue ?? "",
                });
              }}
              localValue={values.searchValue}
              errorMessage={errors.name}
              label={cT("fullName")}
              selectedKey={values.id}
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
                          <ImageWrapper
                            quality={80}
                            placeholder={result.imageBlurData ? "blur" : "empty"}
                            blurDataURL={result.imageBlurData ?? undefined}
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
                    <SpeechAlert
                      text={t("citizenDead", {
                        date: format(new Date(currentResult.dateOfDead), "MMMM do yyyy"),
                      })}
                    >
                      <div className="p-2 my-2 font-semibold text-black rounded-md bg-amber-500">
                        {t("citizenDead", {
                          date: format(new Date(currentResult.dateOfDead), "MMMM do yyyy"),
                        })}
                      </div>
                    </SpeechAlert>
                  ) : null}

                  {currentResult.missing && currentResult.dateOfMissing ? (
                    <SpeechAlert
                      text={t("citizenMissing", {
                        date: format(new Date(currentResult.dateOfMissing), "MMMM do yyyy"),
                      })}
                    >
                      <div className="p-2 my-2 font-semibold text-black rounded-md bg-amber-500">
                        {t("citizenMissing", {
                          date: format(new Date(currentResult.dateOfMissing), "MMMM do yyyy"),
                        })}
                      </div>
                    </SpeechAlert>
                  ) : null}

                  {bolo ? (
                    <SpeechAlert text={t("citizenBoloPlaced")}>
                      <div className="p-2 my-2 font-semibold text-black rounded-md bg-amber-500">
                        {t("citizenBoloPlaced")}
                      </div>
                    </SpeechAlert>
                  ) : null}

                  {hasActiveWarrants ? (
                    <SpeechAlert text={t("hasWarrants")}>
                      <div className="p-2 my-2 font-semibold bg-red-700 rounded-md">
                        {t("hasWarrants")}
                      </div>
                    </SpeechAlert>
                  ) : null}

                  <div className="flex flex-col md:flex-row mt-3">
                    <div className="mr-2 min-w-[100px]">
                      {currentResult.imageId ? (
                        <button
                          type="button"
                          onClick={() => modalState.openModal(ModalIds.CitizenImage)}
                          className="cursor-pointer"
                        >
                          <ImageWrapper
                            quality={100}
                            placeholder={currentResult.imageBlurData ? "blur" : "empty"}
                            blurDataURL={currentResult.imageBlurData ?? undefined}
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

                    <NameSearchBasicInformation />

                    <div className="w-full">
                      <NameSearchLicensesSection isLeo={isLeo} />

                      <div className="mt-4">
                        <Infofield label={vT("flags")}>
                          {currentResult.flags?.map((v) => v.value).join(", ") || common("none")}
                        </Infofield>

                        {isLeo ? (
                          <Button
                            size="xs"
                            type="button"
                            className="mt-2"
                            onPress={() => modalState.openModal(ModalIds.ManageCitizenFlags)}
                          >
                            {t("manageCitizenFlags")}
                          </Button>
                        ) : null}
                      </div>

                      <div className="mt-4">
                        <Infofield label={cT("addressFlags")}>
                          {currentResult.addressFlags?.map((v) => v.value).join(", ") ||
                            common("none")}
                        </Infofield>

                        {isDispatch ? (
                          <Button
                            size="xs"
                            type="button"
                            className="mt-2"
                            onPress={() => modalState.openModal(ModalIds.ManageAddressFlags)}
                          >
                            {t("manageAddressFlags")}
                          </Button>
                        ) : null}
                      </div>
                    </div>
                  </div>

                  <div className="mt-5">
                    <NameSearchTabsContainer />
                  </div>
                </div>
              )
            ) : null}

            <NameSearchFooter isLeo={isLeo} loadingState={state} />

            <AutoSubmit />
            <VehicleSearchModal id={ModalIds.VehicleSearchWithinName} />
            <WeaponSearchModal id={ModalIds.WeaponSearchWithinName} />
            {(CREATE_USER_CITIZEN_LEO && isLeo) ||
            (LEO_EDITABLE_CITIZEN_PROFILE && hasManageCitizenProfilePermissions) ? (
              <CreateOrManageCitizenModal />
            ) : null}
            {currentResult && !currentResult.isConfidential ? (
              <>
                <ManageLicensePointsModal />
                <ManageCitizenFlagsModal />
                <ManageCitizenAddressFlagsModal />
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
