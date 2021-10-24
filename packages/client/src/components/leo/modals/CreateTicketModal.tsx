import { CREATE_TICKET_SCHEMA } from "@snailycad/schemas";
import { Button } from "components/Button";
import { Error } from "components/form/Error";
import { FormField } from "components/form/FormField";
import { Input } from "components/form/Input";
import { Select, SelectValue } from "components/form/Select";
import { Loader } from "components/Loader";
import { Modal } from "components/modal/Modal";
import { useModal } from "context/ModalContext";
import { useValues } from "context/ValuesContext";
import { Form, Formik, yupToFormErrors } from "formik";
import { handleValidate } from "lib/handleValidate";
import useFetch from "lib/useFetch";
import { ModalIds } from "types/ModalIds";
import { useTranslations } from "use-intl";
import { Textarea } from "components/form/Textarea";
import { useCitizen } from "context/CitizenContext";
import { RecordType } from "types/prisma";

export const CreateTicketModal = ({ type }: { type: RecordType }) => {
  const { isOpen, closeModal } = useModal();
  const common = useTranslations("Common");
  const t = useTranslations("Leo");

  const data = {
    [RecordType.TICKET]: {
      title: "createTicket",
      id: ModalIds.CreateTicket,
    },
    [RecordType.ARREST_REPORT]: {
      title: "createArrestReport",
      id: ModalIds.CreateArrestReport,
    },
    [RecordType.WRITTEN_WARNING]: {
      title: "createWrittenWarning",
      id: ModalIds.CreateWrittenWarning,
    },
  };

  const { state, execute } = useFetch();
  const { penalCode } = useValues();
  const { citizens } = useCitizen();

  async function onSubmit(values: typeof INITIAL_VALUES) {
    const { json } = await execute("/records", {
      method: "POST",
      data: {
        ...values,
        type,
        violations: values.violations.map((v) => v.value),
      },
    });

    if (json.id) {
      closeModal(data[type].id);
    }
  }

  const validate = handleValidate(CREATE_TICKET_SCHEMA);
  const INITIAL_VALUES = {
    type,
    citizenId: {} as SelectValue,
    violations: [] as SelectValue[],
    postal: "",
    notes: "",
  };

  return (
    <Modal
      title={t(data[type].title)}
      onClose={() => closeModal(data[type].id)}
      isOpen={isOpen(data[type].id)}
      className="min-w-[600px]"
    >
      <Formik validate={validate} initialValues={INITIAL_VALUES} onSubmit={onSubmit}>
        {({ handleChange, errors, values, isValid }) => (
          <Form>
            <FormField label={t("citizen")}>
              <Select
                value={values.citizenId}
                hasError={!!errors.citizenId}
                name="citizenId"
                onChange={handleChange}
                values={citizens.map((v) => ({
                  label: `${v.name} ${v.surname}`,
                  value: v.id,
                }))}
              />
              <Error>{errors.citizenId}</Error>
            </FormField>

            <FormField label={t("postal")}>
              <Input
                value={values.postal}
                hasError={!!errors.postal}
                id="postal"
                onChange={handleChange}
              />
              <Error>{errors.postal}</Error>
            </FormField>

            <FormField label={t("violations")}>
              <Select
                value={values.violations}
                hasError={!!errors.violations}
                name="violations"
                onChange={handleChange}
                isMulti
                values={penalCode.values.map((value) => ({
                  label: value.title,
                  value: value.id,
                }))}
              />
              <Error>{errors.violations}</Error>
            </FormField>

            <FormField label={t("notes")}>
              <Textarea
                value={values.notes}
                hasError={!!errors.notes}
                id="notes"
                onChange={handleChange}
              />
              <Error>{errors.notes}</Error>
            </FormField>

            <footer className="mt-5 flex justify-end">
              <Button type="reset" onClick={() => closeModal(data[type].id)} variant="cancel">
                {common("cancel")}
              </Button>
              <Button
                className="flex items-center"
                disabled={!isValid || state === "loading"}
                type="submit"
              >
                {state === "loading" ? <Loader className="mr-2" /> : null}
                {common("create")}
              </Button>
            </footer>
          </Form>
        )}
      </Formik>
    </Modal>
  );
};
