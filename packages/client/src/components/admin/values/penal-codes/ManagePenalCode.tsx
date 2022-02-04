import { CREATE_PENAL_CODE_SCHEMA } from "@snailycad/schemas";
import { Button } from "components/Button";
import { FormField } from "components/form/FormField";
import { Input } from "components/form/inputs/Input";
import { Loader } from "components/Loader";
import { Modal } from "components/modal/Modal";
import { Formik, useFormikContext } from "formik";
import { handleValidate } from "lib/handleValidate";
import useFetch from "lib/useFetch";
import { useModal } from "context/ModalContext";
import type { PenalCode, PenalCodeGroup, ValueType } from "@snailycad/types";
import { useTranslations } from "use-intl";
import { FormRow } from "components/form/FormRow";
import { Select } from "components/form/Select";
import { dataToSlate, Editor } from "components/modal/DescriptionModal/Editor";
import { ModalIds } from "types/ModalIds";

interface Props {
  type: ValueType;
  penalCode: PenalCode | null;
  groups: PenalCodeGroup[];
  onCreate: (newValue: PenalCode) => void;
  onUpdate: (oldValue: PenalCode, newValue: PenalCode) => void;
}

export function ManagePenalCode({ onCreate, onUpdate, groups, type, penalCode }: Props) {
  const { state, execute } = useFetch();
  const { isOpen, closeModal } = useModal();
  const t = useTranslations(type);
  const common = useTranslations("Common");

  const title = !penalCode ? t("ADD") : t("EDIT");
  const footerTitle = !penalCode ? t("ADD") : common("save");

  async function onSubmit(values: typeof INITIAL_VALUES) {
    const data = {
      ...values,
      fines: values.warningApplicable ? values.fines1.values : values.fines2.values,
      prisonTerm: values.warningApplicable ? null : values.prisonTerm.values,
      bail: values.warningApplicable ? null : values.bail.values,
      groupId: values.group === "ungrouped" ? null : values.group,
    };

    if (penalCode) {
      const { json } = await execute(`/admin/values/${type.toLowerCase()}/${penalCode.id}`, {
        method: "PATCH",
        data,
      });

      if (json?.id) {
        closeModal(ModalIds.ManageValue);
        onUpdate(penalCode, json);
      }
    } else {
      const { json } = await execute(`/admin/values/${type.toLowerCase()}`, {
        method: "POST",
        data,
      });

      if (json?.id) {
        closeModal(ModalIds.ManageValue);
        onCreate(json);
      }
    }
  }

  const INITIAL_VALUES = {
    title: penalCode?.title ?? "",
    description: penalCode?.description ?? "",
    descriptionData: dataToSlate(penalCode),
    group: penalCode?.groupId ?? "",
    warningApplicable: !!penalCode?.warningApplicable,
    fines1: {
      enabled: (penalCode?.warningApplicable?.fines.length ?? 0) > 0,
      values: penalCode?.warningApplicable?.fines ?? [],
    },
    fines2: {
      enabled: (penalCode?.warningNotApplicable?.fines.length ?? 0) > 0,
      values: penalCode?.warningNotApplicable?.fines ?? [],
    },
    prisonTerm: {
      enabled: (penalCode?.warningNotApplicable?.prisonTerm.length ?? 0) > 0,
      values: penalCode?.warningNotApplicable?.prisonTerm ?? [],
    },
    bail: {
      enabled: (penalCode?.warningNotApplicable?.bail.length ?? 0) > 0,
      values: penalCode?.warningNotApplicable?.bail ?? [],
    },
  };

  const validate = handleValidate(CREATE_PENAL_CODE_SCHEMA);

  return (
    <Modal
      className="w-[1000px] min-h-[600px]"
      title={title}
      onClose={() => closeModal(ModalIds.ManageValue)}
      isOpen={isOpen(ModalIds.ManageValue)}
    >
      <Formik validate={validate} onSubmit={onSubmit} initialValues={INITIAL_VALUES}>
        {({ handleSubmit, handleChange, setFieldValue, values, errors }) => (
          <form onSubmit={handleSubmit}>
            <FormField errorMessage={errors.title} label="Title">
              <Input autoFocus name="title" onChange={handleChange} value={values.title} />
            </FormField>

            <FormField errorMessage={errors.description} label="Description">
              <Editor
                value={values.descriptionData}
                onChange={(v) => setFieldValue("descriptionData", v)}
              />
            </FormField>

            <FormField optional errorMessage={errors.group} label="Group">
              <Select
                name="group"
                onChange={handleChange}
                value={values.group}
                values={groups.map((group) => ({
                  value: group.id,
                  label: group.name,
                }))}
              />
            </FormField>

            <FormRow>
              <div className="flex flex-col mr-2.5">
                <FormField checkbox label="Warning applicable">
                  <Input
                    checked={values.warningApplicable}
                    onChange={() => setFieldValue("warningApplicable", true)}
                    type="radio"
                  />
                </FormField>

                <div>
                  <FieldsRow keyValue="fines1" />
                </div>
              </div>

              <div className="ml-2.5">
                <FormField checkbox label="Warning not applicable">
                  <Input
                    checked={!values.warningApplicable}
                    onChange={() => setFieldValue("warningApplicable", false)}
                    type="radio"
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
              <Button
                type="reset"
                onClick={() => closeModal(ModalIds.ManageValue)}
                variant="cancel"
              >
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
}

const FieldsRow = ({ keyValue }: { keyValue: `fines${number}` | "prisonTerm" | "bail" }) => {
  const { values, handleChange, setFieldValue } = useFormikContext<any>();

  const disabled = keyValue === "fines1" ? !values.warningApplicable : values.warningApplicable;
  const fieldDisabled = !values[keyValue].enabled;
  const isDisabled = disabled || fieldDisabled;

  const label = keyValue.startsWith("fines")
    ? "Fines"
    : keyValue === "bail"
    ? "Bail "
    : "Prison Term";

  // bail cannot be enabled when prisonTerm isn't enabled.
  const isBailDisabled = keyValue === "bail" ? !values.prisonTerm.enabled : false;

  return (
    <FormRow className="mb-0">
      <FormField className="mb-0" checkbox label={label}>
        <Input
          disabled={isBailDisabled || disabled}
          onChange={() => setFieldValue(`${keyValue}.enabled`, !values[keyValue].enabled)}
          checked={values[keyValue].enabled}
          type="checkbox"
        />
      </FormField>

      <FormRow className="items-center" flexLike>
        <FormField label="Min.">
          <Input
            required
            min={0}
            type="number"
            onChange={handleChange}
            name={`${keyValue}.values[0]`}
            value={values[keyValue].values[0]}
            placeholder="Min."
            className="min-w-[100px]"
            disabled={isDisabled}
          />
        </FormField>
        <span className="mb-2.5">{" - "}</span>
        <FormField label="Max.">
          <Input
            required
            min={0}
            type="number"
            onChange={handleChange}
            name={`${keyValue}.values[1]`}
            value={values[keyValue].values[1]}
            placeholder="Max."
            className="min-w-[100px]"
            disabled={isDisabled}
          />
        </FormField>
      </FormRow>
    </FormRow>
  );
};
