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
import { Form, Formik, useFormikContext } from "formik";
import { handleValidate } from "lib/handleValidate";
import useFetch from "lib/useFetch";
import { ModalIds } from "types/ModalIds";
import { useTranslations } from "use-intl";
import { Textarea } from "components/form/Textarea";
import { useCitizen } from "context/CitizenContext";
import { RecordType, PenalCode } from "types/prisma";
import { TableItem } from "./CreateRecordModal/TableItem";

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
        fine: values.fine.enabled ? values.fine.value : null,
        jailTime: values.jailTime.enabled ? values.jailTime.value : null,
        bail: values.jailTime.enabled ? values.bail.value : null,
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
    fine: { enabled: false, value: "" },
    jailTime: { enabled: false, value: "" },
    bail: { value: "" },
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
                values={
                  penalCode.values
                    .filter((v) => (type === "WRITTEN_WARNING" ? v.warningApplicable : true))
                    .map((value) => ({
                      label: value.title,
                      value,
                    })) as any
                }
              />
              <Error>{errors.violations}</Error>
            </FormField>

            <PenalCodesTable penalCodes={values.violations.map((v) => v.value) as any} />

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
  const { values } = useFormikContext<any>();

  if (penalCodes.length <= 0) {
    return <p className="mb-3">No penal codes selected.</p>;
  }

  const totalFines = (values.violations as any[]).reduce((ac, cv) => ac + cv.value.fine, 0);

  return (
    <div className="w-full my-3 overflow-x-auto">
      <table className="w-full overflow-hidden whitespace-nowrap max-h-64">
        <thead>
          <tr>
            <th>{"Penal Code"}</th>
            <th>{"Data"}</th>
          </tr>
        </thead>
        <tbody>
          {penalCodes.map((penalCode) => (
            <TableItem key={penalCode.id} penalCode={penalCode} />
          ))}
        </tbody>
      </table>
      <p className="flex items-center justify-center w-full gap-2 p-2 px-3">
        <span className="mr-2 font-semibold uppercase select-none">TOTAL </span>

        <span className="ml-2">
          <span className="font-semibold select-none">Fines: </span> ${totalFines}
        </span>
        <span>{"/"}</span>
        <span className="ml-2">
          <span className="font-semibold select-none">Jail Time: </span>
          {values.jailTime.value ?? 0}
        </span>
        <span>{"/"}</span>
        <span className="ml-2">
          <span className="font-semibold select-none">Bail: </span> ${values.bail.value ?? 0}
        </span>
      </p>
    </div>
  );
};
