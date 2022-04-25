import type { EmsFdDeputy, Officer, UnitQualification } from "@snailycad/types";
import { Button } from "components/Button";
import { FormField } from "components/form/FormField";
import { Select } from "components/form/Select";
import { Loader } from "components/Loader";
import { Modal } from "components/modal/Modal";
import { useValues } from "context/ValuesContext";
import { Form, Formik } from "formik";
import useFetch from "lib/useFetch";
import { useTranslations } from "next-intl";
import { useModal } from "state/modalState";
import { ModalIds } from "types/ModalIds";

interface Props {
  unit: (EmsFdDeputy | Officer) & { qualifications: UnitQualification[] };
  setUnit: React.Dispatch<React.SetStateAction<any>>;
}

export function AddQualificationsModal({ unit, setUnit }: Props) {
  const common = useTranslations("Common");
  const t = useTranslations();
  const { isOpen, closeModal } = useModal();
  const { state, execute } = useFetch();
  const { qualification } = useValues();

  function handleClose() {
    closeModal(ModalIds.ManageUnitQualifications);
  }

  async function handleSubmit(values: typeof INITIAL_VALUES) {
    const { json } = await execute(`/admin/manage/units/${unit.id}/qualifications`, {
      method: "POST",
      data: values,
    });

    if (json.id) {
      // todo: update state
      setUnit((p: Props["unit"]) => ({ ...p, qualifications: [json, ...p.qualifications] }));
      closeModal(ModalIds.ManageUnitQualifications);
    }
  }

  const INITIAL_VALUES = {
    qualificationId: "",
  };

  return (
    <Modal
      title={t("Leo.addQualification")}
      onClose={() => closeModal(ModalIds.ManageUnitQualifications)}
      isOpen={isOpen(ModalIds.ManageUnitQualifications)}
      className="min-w-[600px]"
    >
      <Formik initialValues={INITIAL_VALUES} onSubmit={handleSubmit}>
        {({ handleChange, errors, values, isValid }) => (
          <Form>
            <FormField errorMessage={errors.qualificationId} label={t("Leo.qualification")}>
              <Select
                value={values.qualificationId}
                name="qualificationId"
                onChange={handleChange}
                values={qualification.values.map((q) => ({
                  value: q.id,
                  label: q.value.value,
                }))}
              />
            </FormField>

            <footer className="flex justify-end mt-5">
              <Button type="reset" onClick={handleClose} variant="cancel">
                {common("cancel")}
              </Button>
              <Button
                className="flex items-center"
                disabled={!isValid || state === "loading"}
                type="submit"
              >
                {state === "loading" ? <Loader className="mr-2" /> : null}
                {t("Leo.addQualification")}
              </Button>
            </footer>
          </Form>
        )}
      </Formik>
    </Modal>
  );
}
