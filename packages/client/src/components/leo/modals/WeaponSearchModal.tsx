import * as React from "react";
import { Button } from "components/Button";
import { FormField } from "components/form/FormField";
import { Loader } from "components/Loader";
import { Modal } from "components/modal/Modal";
import { useModal } from "context/ModalContext";
import { Form, Formik } from "formik";
import useFetch from "lib/useFetch";
import { ModalIds } from "types/ModalIds";
import { useTranslations } from "use-intl";
import { Input } from "components/form/inputs/Input";
import { Infofield } from "components/shared/Infofield";
import { useWeaponSearch } from "state/search/weaponSearchState";
import { CustomFieldsArea } from "./CustomFieldsArea";
import { useRouter } from "next/router";
import { ManageCustomFieldsModal } from "./NameSearchModal/ManageCustomFieldsModal";
import { CustomFieldCategory } from "@snailycad/types";

export function WeaponSearchModal() {
  const { isOpen, openModal, closeModal } = useModal();
  const common = useTranslations("Common");
  const wT = useTranslations("Weapons");
  const t = useTranslations("Leo");
  const { state, execute } = useFetch();
  const { currentResult, setCurrentResult } = useWeaponSearch();
  const router = useRouter();
  const isLeo = router.pathname === "/officer";

  React.useEffect(() => {
    if (!isOpen(ModalIds.WeaponSearch)) {
      setCurrentResult(undefined);
    }
  }, [isOpen, setCurrentResult]);

  function handleNameClick() {
    if (!currentResult) return;

    openModal(ModalIds.NameSearch, {
      name: `${currentResult.citizen.name} ${currentResult.citizen.surname}`,
    });
    closeModal(ModalIds.WeaponSearch);
  }

  async function onSubmit(values: typeof INITIAL_VALUES) {
    const { json } = await execute("/search/weapon", {
      method: "POST",
      data: values,
      noToast: true,
    });

    if (json.id) {
      setCurrentResult(json);
    } else {
      setCurrentResult(null);
    }
  }

  const INITIAL_VALUES = {
    serialNumber: currentResult?.serialNumber ?? "",
  };

  return (
    <Modal
      title={t("weaponSearch")}
      onClose={() => closeModal(ModalIds.WeaponSearch)}
      isOpen={isOpen(ModalIds.WeaponSearch)}
      className="w-[750px]"
    >
      <Formik initialValues={INITIAL_VALUES} onSubmit={onSubmit}>
        {({ handleChange, errors, values, isValid }) => (
          <Form>
            <FormField errorMessage={errors.serialNumber} label={t("serialNumber")}>
              <Input value={values.serialNumber} name="serialNumber" onChange={handleChange} />
            </FormField>

            {!currentResult ? (
              typeof currentResult === "undefined" ? null : (
                <p>{t("weaponNotFound")}</p>
              )
            ) : (
              <div className="mt-3">
                <h3 className="text-2xl font-semibold">{t("results")}</h3>

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
                  <li>
                    <Infofield className="capitalize" label={t("owner")}>
                      <Button
                        title={common("openInSearch")}
                        small
                        type="button"
                        onClick={handleNameClick}
                      >
                        {currentResult.citizen.name} {currentResult.citizen.surname}
                      </Button>
                    </Infofield>
                  </li>

                  <CustomFieldsArea currentResult={currentResult} isLeo={isLeo} />
                </ul>
              </div>
            )}

            <footer className="flex justify-end mt-5">
              <Button
                type="reset"
                onClick={() => closeModal(ModalIds.WeaponSearch)}
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
          </Form>
        )}
      </Formik>

      {currentResult ? (
        <ManageCustomFieldsModal
          category={CustomFieldCategory.WEAPON}
          url={`/search/actions/custom-fields/weapon/${currentResult.id}`}
          allCustomFields={currentResult.allCustomFields ?? []}
          customFields={currentResult.customFields ?? []}
          onUpdate={(results) => setCurrentResult({ ...currentResult, ...results })}
        />
      ) : null}
    </Modal>
  );
}
