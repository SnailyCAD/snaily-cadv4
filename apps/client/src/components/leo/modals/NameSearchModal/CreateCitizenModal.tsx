import { Modal } from "components/modal/Modal";
import { useModal } from "state/modalState";
import useFetch from "lib/useFetch";
import { useTranslations } from "next-intl";
import { ModalIds } from "types/ModalIds";
import { ManageCitizenForm } from "components/citizen/ManageCitizenForm";
import { Loader } from "@snailycad/ui";
import type { SelectValue } from "components/form/Select";
import { useNameSearch } from "state/search/name-search-state";
import { useLoadValuesClientSide } from "hooks/useLoadValuesClientSide";
import { ValueType } from "@snailycad/types";
import { useFeatureEnabled } from "hooks/useFeatureEnabled";
import type {
  PostCitizenImageByIdData,
  PostSearchActionsCreateCitizen,
} from "@snailycad/types/api";
import { shallow } from "zustand/shallow";

export function CreateCitizenModal() {
  const { isOpen, closeModal } = useModal();
  const t = useTranslations("Leo");
  const { state, execute } = useFetch();
  const { setCurrentResult, setResults } = useNameSearch(
    (state) => ({
      setCurrentResult: state.setCurrentResult,
      setResults: state.setResults,
    }),
    shallow,
  );
  const { CREATE_USER_CITIZEN_LEO } = useFeatureEnabled();
  const { isLoading } = useLoadValuesClientSide({
    enabled: CREATE_USER_CITIZEN_LEO,
    valueTypes: [ValueType.GENDER, ValueType.ETHNICITY],
  });

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
    const { json, error } = await execute<PostSearchActionsCreateCitizen>({
      path: "/search/actions/citizen",
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

    const errors = ["dateLargerThanNow", "nameAlreadyTaken", "invalidImageType"];
    if (errors.includes(error as string)) {
      helpers.setCurrentStep(0);
    }

    if (json.id) {
      let imageJson;
      if (formData) {
        const { json: _imageJson } = await execute<PostCitizenImageByIdData>({
          path: `/citizen/${json.id}`,
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
        <ManageCitizenForm
          cancelURL="#"
          formFeatures={{ "edit-name": true }}
          onSubmit={onSubmit}
          citizen={null}
          state={state}
        />
      )}
    </Modal>
  );
}
