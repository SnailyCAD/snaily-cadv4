import { CREATE_PENAL_CODE_SCHEMA } from "@snailycad/schemas";
import { Button } from "components/Button";
import { Error } from "components/form/Error";
import { FormField } from "components/form/FormField";
import { Input } from "components/form/Input";
import { Loader } from "components/Loader";
import { Modal } from "components/modal/Modal";
import { Formik, useFormikContext } from "formik";
import { handleValidate } from "lib/handleValidate";
import useFetch from "lib/useFetch";
import { useModal } from "context/ModalContext";
import { PenalCode, ValueType } from "types/prisma";
import { useTranslations } from "use-intl";
import { Textarea } from "components/form/Textarea";
import { FormRow } from "components/form/FormRow";

interface Props {
  type: ValueType;
  penalCode: PenalCode | null;
  onCreate: (newValue: PenalCode) => void;
  onUpdate: (oldValue: PenalCode, newValue: PenalCode) => void;
}

export const ManagePenalCode = ({ onCreate, onUpdate, type, penalCode }: Props) => {
  const { state, execute } = useFetch();
  const { isOpen, closeModal } = useModal();
  const t = useTranslations(type);
  const common = useTranslations("Common");

  const title = !penalCode ? t("ADD") : t("EDIT");
  const footerTitle = !penalCode ? t("ADD") : common("save");

  async function onSubmit(values: typeof INITIAL_VALUES) {
    if (penalCode) {
      const { json } = await execute(`/admin/values/${type.toLowerCase()}/${penalCode.id}`, {
        method: "PATCH",
        data: values,
      });

      if (json?.id) {
        closeModal("manageValue");
        onUpdate(penalCode, json);
      }
    } else {
      const { json } = await execute(`/admin/values/${type.toLowerCase()}`, {
        method: "POST",
        data: values,
      });

      if (json?.id) {
        closeModal("manageValue");
        onCreate(json);
      }
    }
  }

  const INITIAL_VALUES = {
    title: penalCode?.title ?? "",
    description: penalCode?.description ?? "",
    // @ts-expect-error todo
    warningApplicable: penalCode?.warningApplicable ?? true,
    fines1: { enabled: true, values: [] },
    fines2: { enabled: false, values: [] },
    prisonTerm: { enabled: false, values: [] },
    bail: { enabled: false, values: [] },
  };

  const validate = handleValidate(CREATE_PENAL_CODE_SCHEMA);

  return (
    <Modal
      className="w-[1000px] min-h-[600px]"
      title={title}
      onClose={() => closeModal("manageValue")}
      isOpen={isOpen("manageValue")}
    >
      <Formik validate={validate} onSubmit={onSubmit} initialValues={INITIAL_VALUES}>
        {({ handleSubmit, setFieldValue, handleChange, values, errors }) => (
          <form onSubmit={handleSubmit}>
            <FormField fieldId="title" label="Title">
              <Input
                autoFocus
                id="title"
                name="title"
                onChange={handleChange}
                value={values.title}
              />
              <Error>{errors.title}</Error>
            </FormField>

            <FormField fieldId="description" label="Description">
              <Textarea
                id="description"
                name="description"
                onChange={handleChange}
                value={values.description}
                className="min-h-[8em]"
              />
              <Error>{errors.description}</Error>
            </FormField>

            <FormRow>
              <div className="flex flex-col mr-2.5">
                <FormField fieldId="warning_applicable_1" checkbox label="Warning applicable">
                  <Input
                    checked={values.warningApplicable}
                    onChange={() => setFieldValue("warningApplicable", true)}
                    type="radio"
                    id="warning_applicable_1"
                    name="warning_applicable"
                  />
                </FormField>

                <div>
                  <FieldsRow keyValue="fines1" />
                </div>
              </div>

              <div className="ml-2.5">
                <FormField checkbox fieldId="warning_applicable_2" label="Warning not applicable">
                  <Input
                    checked={!values.warningApplicable}
                    onChange={() => setFieldValue("warningApplicable", false)}
                    type="radio"
                    id="warning_applicable_2"
                    name="warning_applicable"
                  />
                </FormField>

                <div>
                  <FieldsRow keyValue="fines2" />
                  <FieldsRow keyValue="prisonTerm" />
                  <FieldsRow keyValue="bail" />
                </div>
              </div>
            </FormRow>

            <footer className="flex justify-end mt-5">
              <Button type="reset" onClick={() => closeModal("manageValue")} variant="cancel">
                Cancel
              </Button>
              <Button className="flex items-center" disabled={state === "loading"} type="submit">
                {state === "loading" ? <Loader className="mr-2" /> : null}
                {footerTitle}
              </Button>
            </footer>
          </form>
        )}
      </Formik>
    </Modal>
  );
};

const FieldsRow = ({ keyValue }: { keyValue: string }) => {
  const { values, handleChange, setFieldValue } = useFormikContext<any>();

  const disabled = keyValue === "fines1" ? !values.warningApplicable : values.warningApplicable;
  const fieldDisabled = !values[keyValue].enabled;
  const label = keyValue.startsWith("fines")
    ? "Fines"
    : keyValue === "bail"
    ? "Bail "
    : "Prison Term";

  return (
    <FormRow className="mb-0">
      <FormField className="mb-0" fieldId={keyValue} checkbox label={label}>
        <Input
          disabled={disabled}
          id={keyValue}
          onChange={() => setFieldValue(`${keyValue}.enabled`, !values[keyValue].enabled)}
          checked={values[keyValue].enabled}
          type="checkbox"
        />
      </FormField>

      <FormRow className="items-center" flexLike>
        <FormField label={null} disabled={disabled || fieldDisabled}>
          <Input
            required
            min={0}
            type="number"
            onChange={handleChange}
            name={`${keyValue}.values[0]`}
            value={values[keyValue].values[0]}
            placeholder="Min."
          />
        </FormField>
        <span className="mb-2.5">{" - "}</span>
        <FormField label={null} disabled={disabled || fieldDisabled}>
          <Input
            required
            min={0}
            type="number"
            onChange={handleChange}
            name={`${keyValue}.values[1]`}
            value={values[keyValue].values[1]}
            placeholder="Max."
          />
        </FormField>
      </FormRow>
    </FormRow>
  );
};
