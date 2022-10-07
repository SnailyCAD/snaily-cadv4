import { Loader, Button, SelectField } from "@snailycad/ui";
import { Modal } from "components/modal/Modal";
import { useModal } from "state/modalState";
import { Form, Formik } from "formik";
import { useTranslations } from "next-intl";
import type { Unit } from "src/pages/admin/manage/units";
import { ModalIds } from "types/ModalIds";

export function AlertDeclineOfficerModal({
  onSubmit,
  state,
}: {
  onSubmit(data: { action: string; unit: Unit; helpers: any }): void;
  state: "loading" | "idle" | "error" | null;
}) {
  const common = useTranslations("Common");
  const t = useTranslations("Management");
  const { isOpen, closeModal, getPayload } = useModal();
  const unit = getPayload<Unit>(ModalIds.AlertDeclineOfficer);

  function handleClose() {
    closeModal(ModalIds.AlertDeclineOfficer);
  }

  const ACTIONS = [
    { value: "SET_DEPARTMENT_DEFAULT", label: "Set department to default department" },
    { value: "SET_DEPARTMENT_NULL", label: "Set department to none" },
    { value: "DELETE_UNIT", label: "Delete Unit" },
  ];

  const INITIAL_VALUES = {
    action: ACTIONS[0]!.value,
  };

  return (
    <Modal
      title={t("declineUnit")}
      onClose={() => closeModal(ModalIds.AlertDeclineOfficer)}
      isOpen={isOpen(ModalIds.AlertDeclineOfficer)}
      className="min-w-[600px]"
    >
      <Formik
        initialValues={INITIAL_VALUES}
        onSubmit={(d, helpers) => onSubmit({ ...d, helpers, unit: unit! })}
      >
        {({ setFieldValue, errors, values, isValid }) => (
          <Form>
            <SelectField
              errorMessage={errors.action}
              label={t("action")}
              options={ACTIONS}
              name="action"
              onSelectionChange={(key) => setFieldValue("action", key)}
              selectedKey={values.action}
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
                {t("declineUnit")}
              </Button>
            </footer>
          </Form>
        )}
      </Formik>
    </Modal>
  );
}
