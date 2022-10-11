import { QualificationValueType } from "@snailycad/types";
import type {
  GetManageUnitByIdData,
  PostManageUnitAddQualificationData,
} from "@snailycad/types/api";
import { Loader, Button } from "@snailycad/ui";
import { FormField } from "components/form/FormField";
import { Select } from "components/form/Select";
import { Modal } from "components/modal/Modal";
import { useValues } from "context/ValuesContext";
import { Form, Formik } from "formik";
import useFetch from "lib/useFetch";
import { useTranslations } from "next-intl";
import { useModal } from "state/modalState";
import { ModalIds } from "types/ModalIds";

interface Props {
  unit: GetManageUnitByIdData;
  setUnit: React.Dispatch<React.SetStateAction<GetManageUnitByIdData>>;
}

export function AddQualificationsModal({ unit, setUnit }: Props) {
  const common = useTranslations("Common");
  const t = useTranslations();
  const { isOpen, closeModal, getPayload } = useModal();
  const { state, execute } = useFetch();
  const { qualification } = useValues();
  const type = getPayload<QualificationValueType>(ModalIds.ManageUnitQualifications);

  function handleClose() {
    closeModal(ModalIds.ManageUnitQualifications);
  }

  async function handleSubmit(values: typeof INITIAL_VALUES) {
    const { json } = await execute<PostManageUnitAddQualificationData>({
      path: `/admin/manage/units/${unit.id}/qualifications`,
      method: "POST",
      data: values,
    });

    if (json.id) {
      setUnit((p) => ({ ...p, qualifications: [json, ...p.qualifications] }));
      closeModal(ModalIds.ManageUnitQualifications);
    }
  }

  const INITIAL_VALUES = {
    qualificationId: "",
  };

  return (
    <Modal
      title={type === QualificationValueType.AWARD ? t("Leo.addAward") : t("Leo.addQualification")}
      onClose={() => closeModal(ModalIds.ManageUnitQualifications)}
      isOpen={isOpen(ModalIds.ManageUnitQualifications)}
      className="min-w-[600px]"
    >
      <Formik initialValues={INITIAL_VALUES} onSubmit={handleSubmit}>
        {({ handleChange, errors, values, isValid }) => (
          <Form>
            <FormField
              errorMessage={errors.qualificationId}
              label={
                type === QualificationValueType.AWARD ? t("Leo.award") : t("Leo.qualification")
              }
            >
              <Select
                value={values.qualificationId}
                name="qualificationId"
                onChange={handleChange}
                values={qualification.values
                  .filter((v) => {
                    return !v.departments?.length
                      ? v.qualificationType === type
                      : v.departments.some((v) => unit.departmentId === v.id) &&
                          v.qualificationType === type;
                  })
                  .map((q) => ({
                    value: q.id,
                    label: q.value.value,
                  }))}
              />
            </FormField>

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
