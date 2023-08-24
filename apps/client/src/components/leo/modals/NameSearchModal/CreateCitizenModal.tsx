import { Modal } from "components/modal/Modal";
import { useModal } from "state/modalState";
import useFetch from "lib/useFetch";
import { useTranslations } from "next-intl";
import { ModalIds } from "types/modal-ids";
import { ManageCitizenForm } from "components/citizen/ManageCitizenForm";
import { Loader } from "@snailycad/ui";
import { useNameSearch } from "state/search/name-search-state";
import { useLoadValuesClientSide } from "hooks/useLoadValuesClientSide";
import { ValueType } from "@snailycad/types";
import { useFeatureEnabled } from "hooks/useFeatureEnabled";
import type {
  PostCitizenImageByIdData,
  PostSearchActionsCreateCitizen,
} from "@snailycad/types/api";

export function CreateOrManageCitizenModal() {
  const modalState = useModal();
  const t = useTranslations("Leo");
  const { state, execute } = useFetch();
  const { currentResult, setCurrentResult, setResults } = useNameSearch((state) => ({
    setCurrentResult: state.setCurrentResult,
    setResults: state.setResults,
    currentResult: state.currentResult,
  }));
  const { CREATE_USER_CITIZEN_LEO, LEO_EDITABLE_CITIZEN_PROFILE } = useFeatureEnabled();
  const { isLoading } = useLoadValuesClientSide({
    enabled: CREATE_USER_CITIZEN_LEO || LEO_EDITABLE_CITIZEN_PROFILE,
    valueTypes: [ValueType.GENDER, ValueType.ETHNICITY],
  });

  function handleClose() {
    modalState.closeModal(ModalIds.CreateOrManageCitizen);
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
    if (currentResult) {
      if (currentResult.isConfidential) return;

      const { json, error } = await execute<PostSearchActionsCreateCitizen>({
        path: `/search/actions/citizen/${currentResult.id}`,
        method: "PUT",
        helpers,
        data,
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
        handleClose();
      }
    } else {
      const { json, error } = await execute<PostSearchActionsCreateCitizen>({
        path: "/search/actions/citizen",
        method: "POST",
        helpers,
        data,
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
  }

  if (currentResult?.isConfidential) {
    return null;
  }

  return (
    <Modal
      title={t("createCitizen")}
      isOpen={modalState.isOpen(ModalIds.CreateOrManageCitizen)}
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
          formFeatures={{ "edit-name": !currentResult }}
          onSubmit={onSubmit}
          citizen={currentResult}
          state={state}
        />
      )}
    </Modal>
  );
}
