import { COURT_DATE_SCHEMA } from "@snailycad/schemas";
import { Button, DatePickerField, TextField } from "@snailycad/ui";
import { Modal } from "components/modal/Modal";
import { useModal } from "state/modalState";
import { Form, Formik } from "formik";
import { handleValidate } from "lib/handleValidate";
import { useTranslations } from "next-intl";
import { ModalIds } from "types/ModalIds";
import type { CourtDate } from "@snailycad/types";
import { v4 } from "uuid";
import parseISO from "date-fns/parseISO";

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
    date: typeof date?.date === "string" ? parseISO(date.date) : date?.date ?? new Date(),
  };

  function handleClose() {
    onClose?.();
    closeModal(ModalIds.ManageCourtDate);
  }

  function onSubmit(values: typeof INITIAL_VALUES) {
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
        {({ values, errors, setFieldValue }) => (
          <Form>
            <DatePickerField
              value={values.date}
              onChange={(value) => setFieldValue("date", value?.toDate("UTC"))}
              label={t("date")}
              errorMessage={errors.date as string}
            />

            <TextField
              isTextarea
              label={t("note")}
              errorMessage={errors.note}
              name="note"
              value={values.note}
              onChange={(value) => setFieldValue("note", value)}
            />

            <footer className="flex justify-end mt-5">
              <Button onPress={handleClose} variant="cancel" type="reset">
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
