import { COURT_DATE_SCHEMA } from "@snailycad/schemas";
import { Button } from "components/Button";
import { FormField } from "components/form/FormField";
import { Input } from "components/form/inputs/Input";
import { Modal } from "components/modal/Modal";
import { useModal } from "state/modalState";
import { Form, Formik } from "formik";
import { handleValidate } from "lib/handleValidate";
import { useTranslations } from "next-intl";
import { ModalIds } from "types/ModalIds";
import type { CourtDate } from "@snailycad/types";
import { Textarea } from "components/form/Textarea";
import { v4 } from "uuid";
import { isDate } from "components/citizen/ManageCitizenForm";

interface Props {
  date: CourtDate | null;
  onClose?(): void;
  onCreate(date: Pick<CourtDate, "date" | "note" | "id">): void;
  onUpdate(date: Pick<CourtDate, "date" | "note" | "id">): void;
}

export function ManageCourtDateModal({ onCreate, onUpdate, onClose, date }: Props) {
  const { closeModal, isOpen } = useModal();
  const common = useTranslations("Common");
  const t = useTranslations("Courthouse");

  const validate = handleValidate(COURT_DATE_SCHEMA);
  const INITIAL_VALUES = {
    note: date?.note ?? "",
    date: date?.date ?? new Date(),
  };

  function handleClose() {
    onClose?.();
    closeModal(ModalIds.ManageCourtDate);
  }

  async function onSubmit(values: typeof INITIAL_VALUES) {
    closeModal(ModalIds.ManageCourtDate);

    if (date) {
      onUpdate({ ...date, ...values });
    } else {
      onCreate({ id: v4(), ...values });
    }
  }

  return (
    <Modal
      onClose={handleClose}
      isOpen={isOpen(ModalIds.ManageCourtDate)}
      title={t("manageCourtDate")}
      className="w-[600px]"
    >
      <Formik validate={validate} onSubmit={onSubmit} initialValues={INITIAL_VALUES}>
        {({ values, errors, handleChange }) => (
          <Form>
            <FormField label={t("date")} errorMessage={errors.date as string}>
              <Input
                name="date"
                type="date"
                value={
                  isDate(values.date)
                    ? new Date(values.date.toString()).toISOString().slice(0, 10)
                    : String(values.date)
                }
                onChange={handleChange}
              />
            </FormField>

            <FormField label={t("note")} errorMessage={errors.note}>
              <Textarea name="note" value={values.note} onChange={handleChange} />
            </FormField>

            <footer className="flex justify-end mt-5">
              <Button onClick={handleClose} variant="cancel" type="reset">
                {common("cancel")}
              </Button>
              <Button className="flex items-center" type="submit">
                {date ? common("save") : common("create")}
              </Button>
            </footer>
          </Form>
        )}
      </Formik>
    </Modal>
  );
}
