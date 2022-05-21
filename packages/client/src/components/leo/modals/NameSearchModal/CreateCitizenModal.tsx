import * as React from "react";
import { Modal } from "components/modal/Modal";
import { useModal } from "state/modalState";
import useFetch from "lib/useFetch";
import { useTranslations } from "next-intl";
import { ModalIds } from "types/ModalIds";
import { ManageCitizenForm } from "components/citizen/ManageCitizenForm";
import { useValues } from "context/ValuesContext";
import { Loader } from "components/Loader";
import type { SelectValue } from "components/form/Select";
import { useNameSearch } from "state/search/nameSearchState";

let fetched = false;
function useLoadValues() {
  const { setValues } = useValues();

  const { state, execute } = useFetch();

  const handleFetch = React.useCallback(async () => {
    const currentPaths =
      "codes_10,penal_code,impound_lot,license,driverslicense_category,vehicle_flag,citizen_flag";
    const { json } = await execute(`/admin/values/gender?paths=${currentPaths},ethnicity`, {
      method: "GET",
    });

    if (json && Array.isArray(json)) {
      setValues(json);
      fetched = true;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  React.useEffect(() => {
    if (fetched) return;
    handleFetch();
  }, [handleFetch]);

  return { isLoading: state === "loading" };
}

export function CreateCitizenModal() {
  const { isLoading } = useLoadValues();
  const { isOpen, closeModal } = useModal();
  const t = useTranslations("Leo");
  const { state, execute } = useFetch();
  const { setCurrentResult, setResults } = useNameSearch();

  function handleClose() {
    closeModal(ModalIds.CreateCitizen);
  }

  async function onSubmit({
    formData,
    data,
    helpers,
  }: {
    formData?: FormData;
    data: any;
    helpers: any;
  }) {
    const { json } = await execute("/search/actions/citizen", {
      method: "POST",
      helpers,
      data: {
        ...data,
        driversLicenseCategory: Array.isArray(data.driversLicenseCategory)
          ? (data.driversLicenseCategory as SelectValue[]).map((v) => v.value)
          : data.driversLicenseCategory,
        pilotLicenseCategory: Array.isArray(data.pilotLicenseCategory)
          ? (data.pilotLicenseCategory as SelectValue[]).map((v) => v.value)
          : data.pilotLicenseCategory,
        waterLicenseCategory: Array.isArray(data.waterLicenseCategory)
          ? (data.waterLicenseCategory as SelectValue[]).map((v) => v.value)
          : data.waterLicenseCategory,
        firearmLicenseCategory: Array.isArray(data.firearmLicenseCategory)
          ? (data.firearmLicenseCategory as SelectValue[]).map((v) => v.value)
          : data.firearmLicenseCategory,
      },
    });

    if (json.id) {
      let imageJson;
      if (formData) {
        const { json: _imageJson } = await execute(`/citizen/${json.id}`, {
          method: "POST",
          data: formData,
          helpers,
        });

        if (_imageJson) {
          imageJson = _imageJson;
        }
      }

      setCurrentResult({ ...json, ...imageJson });
      setResults([{ ...json, ...imageJson }]);
      handleClose();
    }
  }

  return (
    <Modal
      title={t("createCitizen")}
      isOpen={isOpen(ModalIds.CreateCitizen)}
      onClose={handleClose}
      className="w-[1000px]"
    >
      {isLoading ? (
        <div className="w-full grid place-items-center h-52">
          <Loader className="w-14 h-14 border-[3px]" />
        </div>
      ) : (
        <ManageCitizenForm onSubmit={onSubmit} citizen={null} state={state} />
      )}
    </Modal>
  );
}
