import { COURT_ENTRY_SCHEMA } from "@snailycad/schemas";
import type { CourtDate, CourtEntry } from "@snailycad/types";
import { Loader, Button, TextField } from "@snailycad/ui";
import { FormField } from "components/form/FormField";
import { Modal } from "components/modal/Modal";
import { useModal } from "state/modalState";
import { Form, Formik, FormikHelpers } from "formik";
import { handleValidate } from "lib/handleValidate";
import useFetch from "lib/useFetch";
import { useTranslations } from "next-intl";
import { ModalIds } from "types/ModalIds";
import { DEFAULT_EDITOR_DATA, Editor } from "components/editor/editor";
import { CourtEntryDates } from "./court-entry-dates";
import type { PostCourtEntriesData, PutCourtEntriesData } from "@snailycad/types/api";
import type { z } from "zod";

interface Props {
  courtEntry: CourtEntry | null;
  onClose?(): void;
  onCreate?(entry: CourtEntry): void;
  onUpdate?(entry: CourtEntry): void;
  submitHandler?(values: z.infer<typeof COURT_ENTRY_SCHEMA>): void;
}

export function ManageCourtEntry({
  courtEntry,
  submitHandler,
  onClose,
  onCreate,
  onUpdate,
}: Props) {
  const { closeModal, isOpen } = useModal();
  const common = useTranslations("Common");
  const { state, execute } = useFetch();
  const t = useTranslations("Courthouse");

  const validate = handleValidate(COURT_ENTRY_SCHEMA);
  const INITIAL_VALUES = {
    descriptionData: courtEntry?.descriptionData ?? DEFAULT_EDITOR_DATA,
    title: courtEntry?.title ?? "",
    caseNumber: courtEntry?.caseNumber ?? "",
    dates: courtEntry?.dates ?? [],
  };

  function handleClose() {
    onClose?.();
    closeModal(ModalIds.ManageCourtEntry);
  }

  async function onSubmit(
    values: typeof INITIAL_VALUES,
    helpers: FormikHelpers<typeof INITIAL_VALUES>,
  ) {
    if (submitHandler) {
      return submitHandler(values);
    }

    if (courtEntry) {
      const { json } = await execute<PutCourtEntriesData, typeof INITIAL_VALUES>({
        path: `/court-entries/${courtEntry.id}`,
        method: "PUT",
        data: values,
        helpers,
      });

      if (json.id) {
        onUpdate?.(json);
        closeModal(ModalIds.ManageCourtEntry);
      }
    } else {
      const { json } = await execute<PostCourtEntriesData, typeof INITIAL_VALUES>({
        path: "/court-entries",
        method: "POST",
        data: values,
        helpers,
      });

      if (json.id) {
        onCreate?.(json);
        closeModal(ModalIds.ManageCourtEntry);
      }
    }
  }

  return (
    <Modal
      onClose={handleClose}
      isOpen={isOpen(ModalIds.ManageCourtEntry)}
      title={t("manageCourtEntry")}
      className="w-[750px]"
    >
      <Formik validate={validate} onSubmit={onSubmit} initialValues={INITIAL_VALUES}>
        {({ values, errors, setFieldValue }) => (
          <Form>
            <TextField
              label={t("title")}
              name="title"
              value={values.title}
              onChange={(value) => setFieldValue("title", value)}
              errorMessage={errors.title}
            />

            <TextField
              label={t("caseNumber")}
              name="caseNumber"
              value={values.caseNumber}
              onChange={(value) => setFieldValue("caseNumber", value)}
              errorMessage={errors.caseNumber}
            />

            <FormField
              label={common("description")}
              errorMessage={errors.descriptionData as string}
            >
              <Editor
                value={values.descriptionData}
                onChange={(v) => setFieldValue("descriptionData", v)}
              />
            </FormField>

            <CourtEntryDates
              onDelete={(date) =>
                setFieldValue(
                  "dates",
                  values.dates.filter((v) => v.id !== date.id),
                )
              }
              onCreate={(date) => setFieldValue("dates", [...values.dates, date])}
              onUpdate={(date) => {
                const dates = [...values.dates];
                const idx = dates.findIndex((v) => v.id === date.id);
                dates[idx] = date as CourtDate;

                setFieldValue("dates", dates);
              }}
              dates={values.dates}
            />

            <footer className="flex justify-end mt-5">
              <Button onPress={handleClose} variant="cancel" type="reset">
                {common("cancel")}
              </Button>
              <Button className="flex items-center" disabled={state === "loading"} type="submit">
                {state === "loading" ? <Loader className="mr-2" /> : null}
                {courtEntry ? common("save") : common("create")}
              </Button>
            </footer>
          </Form>
        )}
      </Formik>
    </Modal>
  );
}
