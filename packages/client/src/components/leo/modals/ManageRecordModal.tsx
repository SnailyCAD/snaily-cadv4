import { CREATE_TICKET_SCHEMA } from "@snailycad/schemas";
import { Button } from "components/Button";
import { FormField } from "components/form/FormField";
import { Input } from "components/form/inputs/Input";
import type { SelectValue } from "components/form/Select";
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
import { type Citizen, RecordType, type PenalCode } from "@snailycad/types";
import { InputSuggestions } from "components/form/inputs/InputSuggestions";
import { PersonFill } from "react-bootstrap-icons";
import { useImageUrl } from "hooks/useImageUrl";
import { PenalCodesTable } from "./ManageRecord/PenalCodesTable";
import { SelectPenalCode } from "./ManageRecord/SelectPenalCode";
import type { FullRecord } from "./NameSearchModal/RecordsArea";

interface Props {
  record?: FullRecord | null;
  type: RecordType;
  id?: ModalIds.ManageRecord | ModalIds.CreateTicket;
  isEdit?: boolean;
  onUpdate?(data: FullRecord): void;
}

export function ManageRecordModal({ onUpdate, record, type, isEdit, id }: Props) {
  const { isOpen, closeModal, getPayload } = useModal();
  const common = useTranslations("Common");
  const t = useTranslations("Leo");

  const data = {
    [RecordType.TICKET]: {
      isEdit,
      title: isEdit ? "editTicket" : "createTicket",
      id: id ?? ModalIds.CreateTicket,
    },
    [RecordType.ARREST_REPORT]: {
      isEdit,
      title: isEdit ? "editArrestReport" : "createArrestReport",
      id: id ?? ModalIds.CreateArrestReport,
    },
    [RecordType.WRITTEN_WARNING]: {
      isEdit,
      title: isEdit ? "editWrittenWarning" : "createWrittenWarning",
      id: id ?? ModalIds.CreateWrittenWarning,
    },
  };

  const { state, execute } = useFetch();
  const { penalCode } = useValues();
  const { makeImageUrl } = useImageUrl();
  const penalCodes =
    type === "WRITTEN_WARNING"
      ? penalCode.values.filter(
          (v) => v.warningApplicableId !== null && v.warningNotApplicableId === null,
        )
      : penalCode.values;

  async function onSubmit(values: typeof INITIAL_VALUES) {
    const requestData = {
      ...values,
      type,
      violations: values.violations.map(({ value }: { value: any }) => ({
        penalCodeId: value.id,
        bail: value.jailTime?.enabled ? value.bail?.value : null,
        jailTime: value.jailTime?.enabled ? value.jailTime?.value : null,
        fine: value.fine?.enabled ? value.fine?.value : null,
      })),
    };

    if (record) {
      const { json } = await execute(`/records/record/${record.id}`, {
        method: "PUT",
        data: requestData,
      });

      if (json.id) {
        onUpdate?.(json);
        closeModal(data[type].id);
      }
    } else {
      const { json } = await execute("/records", {
        method: "POST",
        data: requestData,
      });

      if (json.id) {
        closeModal(data[type].id);
      }
    }
  }

  const payload = getPayload<{ citizenId: string; citizenName: string }>(data[type].id);
  const validate = handleValidate(CREATE_TICKET_SCHEMA);

  const INITIAL_VALUES = {
    type,
    citizenId: record?.citizenId ?? payload?.citizenId ?? "",
    citizenName: payload?.citizenName ?? "",
    violations:
      record?.violations.map((v) => ({
        label: v.penalCode.title,
        value: {
          key: v.penalCodeId,
          ...v.penalCode,
          fine: { enabled: !!v.fine, value: v.fine },
          jailTime: { enabled: !!v.jailTime, value: v.jailTime },
          bail: { enabled: !!v.jailTime, value: v.bail },
        },
      })) ?? ([] as SelectValue<PenalCode>[]),
    postal: record?.postal ?? "",
    notes: record?.notes ?? "",
  };

  return (
    <Modal
      title={t(data[type].title)}
      onClose={() => closeModal(data[type].id)}
      isOpen={isOpen(data[type].id)}
      className="w-[800px]"
    >
      <Formik validate={validate} initialValues={INITIAL_VALUES} onSubmit={onSubmit}>
        {({ handleChange, setFieldValue, errors, values, isValid }) => (
          <Form autoComplete="off">
            <FormField errorMessage={errors.citizenName} label={t("citizen")}>
              <InputSuggestions
                inputProps={{
                  value: values.citizenName,
                  name: "citizenName",
                  onChange: handleChange,
                  disabled: !!record,
                }}
                onSuggestionClick={(suggestion) => {
                  setFieldValue("citizenId", suggestion.id);
                  setFieldValue("citizenName", `${suggestion.name} ${suggestion.surname}`);
                }}
                options={{
                  apiPath: "/search/name",
                  dataKey: "name",
                  method: "POST",
                  minLength: 2,
                }}
                Component={({ suggestion }: { suggestion: Citizen }) => (
                  <div className="flex items-center">
                    <div className="mr-2 min-w-[25px]">
                      {suggestion.imageId ? (
                        <img
                          className="rounded-md w-[35px] h-[35px] object-cover"
                          draggable={false}
                          src={makeImageUrl("citizens", suggestion.imageId)}
                        />
                      ) : (
                        <PersonFill className="text-gray-500/60 w-[25px] h-[25px]" />
                      )}
                    </div>
                    <p>
                      {suggestion.name} {suggestion.surname}
                    </p>
                  </div>
                )}
              />
            </FormField>

            <FormField errorMessage={errors.postal} label={t("postal")}>
              <Input value={values.postal} name="postal" onChange={handleChange} />
            </FormField>

            <FormField errorMessage={errors.violations as string} label={t("violations")}>
              <SelectPenalCode
                penalCodes={penalCodes}
                value={values.violations}
                handleChange={handleChange}
              />
            </FormField>

            <PenalCodesTable penalCodes={values.violations.map((v) => v.value)} />

            <FormField optional errorMessage={errors.notes} label={t("notes")}>
              <Textarea value={values.notes} name="notes" onChange={handleChange} />
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
                {record ? common("save") : common("create")}
              </Button>
            </footer>
          </Form>
        )}
      </Formik>
    </Modal>
  );
}
