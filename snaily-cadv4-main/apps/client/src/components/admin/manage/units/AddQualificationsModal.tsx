import { QualificationValueType, ValueType } from "@snailycad/types";
import type {
  GetManageUnitByIdData,
  PostManageUnitAddQualificationData,
} from "@snailycad/types/api";
import { Loader, Button } from "@snailycad/ui";
import { ValueSelectField } from "components/form/inputs/value-select-field";
import { Modal } from "components/modal/Modal";
import { useValues } from "context/ValuesContext";
import { Form, Formik } from "formik";
import useFetch from "lib/useFetch";
import { useTranslations } from "next-intl";
import { useModal } from "state/modalState";
import { ModalIds } from "types/modal-ids";

interface Props {
  unit: GetManageUnitByIdData;
  setUnit: React.Dispatch<React.SetStateAction<GetManageUnitByIdData>>;
}

export function AddQualificationsModal({ unit, setUnit }: Props) {
  const common = useTranslations("Common");
  const t = useTranslations();
  const modalState = useModal();
  const { state, execute } = useFetch();
  const { qualification } = useValues();
  const type = modalState.getPayload<QualificationValueType>(ModalIds.ManageUnitQualifications);

  function handleClose() {
    modalState.closeModal(ModalIds.ManageUnitQualifications);
  }

  async function handleSubmit(values: typeof INITIAL_VALUES) {
    const { json } = await execute<PostManageUnitAddQualificationData>({
      path: `/admin/manage/units/${unit.id}/qualifications`,
      method: "POST",
      data: values,
    });

    if (json.id) {
      setUnit((p) => ({ ...p, qualifications: [json, ...p.qualifications] }));
      modalState.closeModal(ModalIds.ManageUnitQualifications);
    }
  }

  const INITIAL_VALUES = {
    qualificationId: "",
  };

  return (
    <Modal
      title={type === QualificationValueType.AWARD ? t("Leo.addAward") : t("Leo.addQualification")}
      onClose={() => modalState.closeModal(ModalIds.ManageUnitQualifications)}
      isOpen={modalState.isOpen(ModalIds.ManageUnitQualifications)}
      className="min-w-[600px]"
    >
      <Formik initialValues={INITIAL_VALUES} onSubmit={handleSubmit}>
        {({ isValid }) => (
          <Form>
            <ValueSelectField
              fieldName="qualificationId"
              values={qualification.values}
              label={
                type === QualificationValueType.AWARD ? t("Leo.award") : t("Leo.qualification")
              }
              valueType={ValueType.QUALIFICATION}
              filterFn={(value) => {
                return !value.departments?.length
                  ? value.qualificationType === type
                  : value.departments.some((v) => unit.departmentId === v.id) &&
                      value.qualificationType === type;
              }}
            />

            <footer className="flex justify-end mt-5">
              <Button type="reset" onPress={handleClose} variant="cancel">
                {common("cancel")}
              </Button>
              <Button
                className="flex items-center"
                disabled={!isValid || state === "loading"}
                type="submit"
              >
                {state === "loading" ? <Loader className="mr-2" /> : null}
                {type === QualificationValueType.AWARD
                  ? t("Leo.addAward")
                  : t("Leo.addQualification")}
              </Button>
            </footer>
          </Form>
        )}
      </Formik>
    </Modal>
  );
}
