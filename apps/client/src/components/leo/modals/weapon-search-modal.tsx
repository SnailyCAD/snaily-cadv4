import * as React from "react";
import { Loader, Button, AsyncListSearchField, Item, Infofield, Status } from "@snailycad/ui";
import { Modal } from "components/modal/Modal";
import { useModal } from "state/modalState";
import { Form, Formik } from "formik";
import useFetch from "lib/useFetch";
import { ModalIds } from "types/modal-ids";
import { useTranslations } from "use-intl";
import { useWeaponSearch, type WeaponSearchResult } from "state/search/weapon-search-state";
import { CustomFieldsArea } from "./CustomFieldsArea";
import { useRouter } from "next/router";
import { ManageCustomFieldsModal } from "./NameSearchModal/ManageCustomFieldsModal";
import { CustomFieldCategory } from "@snailycad/types";
import { useFeatureEnabled } from "hooks/useFeatureEnabled";
import { ManageWeaponFlagsModal } from "./weapon-search/manage-weapon-flags-modal";

interface Props {
  id?: ModalIds.WeaponSearch | ModalIds.WeaponSearchWithinName;
}

export function WeaponSearchModal({ id = ModalIds.WeaponSearch }: Props) {
  const modalState = useModal();
  const common = useTranslations("Common");
  const wT = useTranslations("Weapons");
  const t = useTranslations("Leo");
  const { state, execute } = useFetch();
  const { currentResult, setCurrentResult } = useWeaponSearch();
  const router = useRouter();
  const isLeo = router.pathname === "/officer";
  const { BUREAU_OF_FIREARMS } = useFeatureEnabled();

  React.useEffect(() => {
    if (!modalState.isOpen(id)) {
      setCurrentResult(undefined);
    }
  }, [id, modalState, setCurrentResult]);

  function handleNameClick() {
    if (!currentResult) return;

    modalState.openModal(ModalIds.NameSearch, {
      ...currentResult.citizen,
      name: `${currentResult.citizen.name} ${currentResult.citizen.surname}`,
    });
    modalState.closeModal(ModalIds.WeaponSearchWithinName);
  }

  async function onSubmit(values: typeof INITIAL_VALUES) {
    const { json } = await execute<WeaponSearchResult>({
      path: "/search/weapon",
      method: "POST",
      data: values,
      noToast: true,
    });

    if (json?.id) {
      setCurrentResult(json);
    } else {
      setCurrentResult(null);
    }
  }

  const INITIAL_VALUES = {
    searchValue: currentResult?.serialNumber ?? "",
    serialNumber: currentResult?.serialNumber ?? "",
  };

  return (
    <Modal
      title={t("weaponSearch")}
      onClose={() => modalState.closeModal(id)}
      isOpen={modalState.isOpen(id)}
      className="w-[750px]"
    >
      <Formik initialValues={INITIAL_VALUES} onSubmit={onSubmit}>
        {({ setValues, setFieldValue, errors, values, isValid }) => (
          <Form>
            <AsyncListSearchField<NonNullable<WeaponSearchResult>>
              allowsCustomValue
              autoFocus
              onInputChange={(value) => setFieldValue("searchValue", value)}
              onSelectionChange={(node) => {
                if (node) {
                  setCurrentResult(node.value);

                  setValues({
                    ...values,
                    searchValue: node.value?.serialNumber ?? node.textValue,
                    serialNumber: node.key as string,
                  });
                }
              }}
              localValue={values.searchValue}
              errorMessage={errors.serialNumber}
              label={t("serialNumber")}
              selectedKey={values.serialNumber}
              fetchOptions={{
                apiPath: "/search/weapon?includeMany=true",
                method: "POST",
                bodyKey: "serialNumber",
                filterTextRequired: true,
              }}
            >
              {(item) => (
                <Item key={item.serialNumber} textValue={item.serialNumber}>
                  {item.serialNumber} ({item.model.value.value})
                </Item>
              )}
            </AsyncListSearchField>

            {!currentResult ? (
              typeof currentResult === "undefined" ? null : (
                <p>{t("weaponNotFound")}</p>
              )
            ) : (
              <div className="mt-3">
                <h3 className="text-2xl font-semibold">{t("results")}</h3>

                <div className="flex gap-x-24">
                  <ul className="mt-2">
                    <li>
                      <Infofield label={wT("model")}>{currentResult.model.value.value}</Infofield>
                    </li>
                    <li>
                      <Infofield label={wT("registrationStatus")}>
                        {currentResult.registrationStatus.value}
                      </Infofield>
                    </li>
                    <li>
                      <Infofield label={wT("serialNumber")}>{currentResult.serialNumber}</Infofield>
                    </li>
                    {BUREAU_OF_FIREARMS ? (
                      <li>
                        <Infofield label={wT("bofStatus")}>
                          <Status fallback="—">{currentResult.bofStatus}</Status>
                        </Infofield>
                      </li>
                    ) : null}

                    <li>
                      <Infofield className="capitalize mt-2" label={t("owner")}>
                        <Button
                          title={common("openInSearch")}
                          size="xs"
                          type="button"
                          onPress={handleNameClick}
                        >
                          {currentResult.citizen.name} {currentResult.citizen.surname}
                        </Button>
                      </Infofield>
                    </li>
                  </ul>

                  <ul>
                    <li className="mt-4">
                      <Infofield label={t("flags")}>
                        {currentResult.flags?.map((v) => v.value).join(", ") || common("none")}
                      </Infofield>

                      {isLeo ? (
                        <Button
                          size="xs"
                          type="button"
                          className="mt-2"
                          onPress={() => modalState.openModal(ModalIds.ManageWeaponFlags)}
                        >
                          {t("manageWeaponFlags")}
                        </Button>
                      ) : null}
                    </li>

                    <CustomFieldsArea currentResult={currentResult} isLeo={isLeo} />
                  </ul>
                </div>
              </div>
            )}

            <footer className="flex justify-end mt-5">
              <Button type="reset" onPress={() => modalState.closeModal(id)} variant="cancel">
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
          </Form>
        )}
      </Formik>

      {currentResult ? (
        <>
          <ManageCustomFieldsModal
            category={CustomFieldCategory.WEAPON}
            url={`/search/actions/custom-fields/weapon/${currentResult.id}`}
            allCustomFields={currentResult.allCustomFields ?? []}
            customFields={currentResult.customFields ?? []}
            onUpdate={(results) => setCurrentResult({ ...currentResult, ...results })}
          />

          <ManageWeaponFlagsModal />
        </>
      ) : null}
    </Modal>
  );
}
