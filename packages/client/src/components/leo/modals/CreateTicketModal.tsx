import { CREATE_TICKET_SCHEMA } from "@snailycad/schemas";
import { Button } from "components/Button";
import { FormField } from "components/form/FormField";
import { Input } from "components/form/Input";
import { SelectValue } from "components/form/Select";
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
import { Citizen, RecordType, PenalCode } from "types/prisma";
import { InputSuggestions } from "components/form/InputSuggestions";
import { PersonFill } from "react-bootstrap-icons";
import { useImageUrl } from "hooks/useImageUrl";
import { PenalCodesTable } from "./CreateRecord/PenalCodesTable";
import { SelectPenalCode } from "./CreateRecord/SelectPenalCode";

export function CreateTicketModal({ type }: { type: RecordType }) {
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
  const { makeImageUrl } = useImageUrl();
  const penalCodes =
    type === "WRITTEN_WARNING"
      ? penalCode.values.filter(
          (v) => v.warningApplicableId !== null && v.warningNotApplicableId === null,
        )
      : penalCode.values;

  async function onSubmit(values: typeof INITIAL_VALUES) {
    const { json } = await execute("/records", {
      method: "POST",
      data: {
        ...values,
        type,
        violations: values.violations.map(({ value }: { value: any }) => ({
          penalCodeId: value.id,
          bail: value.jailTime?.enabled ? value.bail.value : null,
          jailTime: value.jailTime?.enabled ? value.jailTime.value : null,
          fine: value.fine?.enabled ? value.fine.value : null,
        })),
      },
    });

    if (json.id) {
      closeModal(data[type].id);
    }
  }

  const payload = getPayload<{ citizenId: string; citizenName: string }>(data[type].id);
  const validate = handleValidate(CREATE_TICKET_SCHEMA);
  const INITIAL_VALUES = {
    type,
    citizenId: payload?.citizenId ?? "",
    citizenName: payload?.citizenName ?? "",
    violations: [] as SelectValue<PenalCode>[],
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
        {({ handleChange, setFieldValue, errors, values, isValid }) => (
          <Form autoComplete="off">
            <FormField errorMessage={errors.citizenName} label={t("citizen")}>
              <InputSuggestions
                inputProps={{
                  value: values.citizenName,
                  name: "citizenName",
                  onChange: handleChange,
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
              {/* <Select
                extra={{ showPenalCodeDescriptions: true }}
                value={values.violations}
                name="violations"
                onChange={handleChange}
                isMulti
                values={penalCodes.map((value) => ({
                  label: value.title,
                  value,
                }))}
              /> */}
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
                {common("create")}
              </Button>
            </footer>
          </Form>
        )}
      </Formik>
    </Modal>
  );
}
