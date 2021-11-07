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
import { Form, Formik } from "formik";
import { handleValidate } from "lib/handleValidate";
import useFetch from "lib/useFetch";
import { ModalIds } from "types/ModalIds";
import { useTranslations } from "use-intl";
import { Textarea } from "components/form/Textarea";
import { useCitizen } from "context/CitizenContext";
import { RecordType, PenalCode } from "types/prisma";

export const CreateTicketModal = ({ type }: { type: RecordType }) => {
  const { isOpen, closeModal, getPayload } = useModal();
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
    citizenId: getPayload<{ citizenId: string }>(data[type].id)?.citizenId ?? "",
    violations: [] as SelectValue[],
    postal: "",
    notes: "",
  };

  return (
    <Modal
      title={t(data[type].title)}
      onClose={() => closeModal(data[type].id)}
      isOpen={isOpen(data[type].id)}
      className="w-[800px]"
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
                values={penalCode.values
                  .filter((v) => (type === "WRITTEN_WARNING" ? v.warningApplicable : true))
                  .map((value) => ({
                    label: value.title,
                    value: value.id,
                  }))}
              />
              <Error>{errors.violations}</Error>
            </FormField>

            <PenalCodesTable penalCodes={penalCode.values} />

            <FormField label={t("notes")}>
              <Textarea
                value={values.notes}
                hasError={!!errors.notes}
                id="notes"
                onChange={handleChange}
              />
              <Error>{errors.notes}</Error>
            </FormField>

            <footer className="flex justify-end mt-5">
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

const PenalCodesTable = ({ penalCodes }: { penalCodes: PenalCode[] }) => {
  const common = useTranslations("Common");

  return (
    <div className="w-full mt-3 overflow-x-auto">
      <table className="w-full overflow-hidden whitespace-nowrap max-h-64">
        <thead>
          <tr>
            <th>{"title"}</th>
            <th>{"color"}</th>
            <th>{common("actions")}</th>
          </tr>
        </thead>
        <tbody>
          {penalCodes.map((penalCode) => (
            <tr key={penalCode.id}>
              <td>{penalCode.title}</td>
              <td>hello world</td>
              <td className="w-36">
                <Button type="button" className="ml-2" small variant="danger">
                  {common("delete")}
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <div className="w-full p-2 px-3">
            <span className="font-semibold uppercase">TOTAL</span>

            <span className="ml-2">Fines: {}</span>
          </div>
        </tfoot>
      </table>
    </div>
  );
};
