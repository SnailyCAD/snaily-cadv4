import { Button } from "components/Button";
import { FormField } from "components/form/FormField";
import { Select } from "components/form/Select";
import { Loader } from "components/Loader";
import { Modal } from "components/modal/Modal";
import { useModal } from "context/ModalContext";
import { Form, Formik } from "formik";
import { useTranslations } from "next-intl";
import type { Unit } from "src/pages/admin/manage/units";
import { ModalIds } from "types/ModalIds";

export function AlertDeclineOfficerModal({
  onSubmit,
  state,
}: {
  onSubmit: (data: { action: string; officer: Unit; helpers: any }) => void;
  state: "loading" | "idle" | "error" | null;
}) {
  const common = useTranslations("Common");
  const { isOpen, closeModal, getPayload } = useModal();
  const officer = getPayload<Unit>(ModalIds.AlertDeclineOfficer);

  function handleClose() {
    closeModal(ModalIds.AlertDeclineOfficer);
  }

  const ACTIONS = [
    { value: "SET_DEPARTMENT_DEFAULT", label: "Set department to default department" },
    { value: "SET_DEPARTMENT_NULL", label: "Set department to none" },
    { value: "DELETE_OFFICER", label: "Delete officer" },
  ];

  const INITIAL_VALUES = {
    action: ACTIONS[0]!.value,
  };

  return (
    <Modal
      title="Decline Officer"
      onClose={() => closeModal(ModalIds.AlertDeclineOfficer)}
      isOpen={isOpen(ModalIds.AlertDeclineOfficer)}
      className="min-w-[600px]"
    >
      <Formik
        initialValues={INITIAL_VALUES}
        onSubmit={(d, helpers) => onSubmit({ ...d, helpers, officer: officer! })}
      >
        {({ handleChange, errors, values, isValid }) => (
          <Form>
            <FormField errorMessage={errors.action} label="Action">
              <Select
                value={values.action}
                name="action"
                onChange={handleChange}
                values={ACTIONS}
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
                {common("decline")}
              </Button>
            </footer>
          </Form>
        )}
      </Formik>
    </Modal>
  );
}
