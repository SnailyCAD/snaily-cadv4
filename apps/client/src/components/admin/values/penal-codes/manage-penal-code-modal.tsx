import { PENAL_CODE_SCHEMA } from "@snailycad/schemas";
import { FormField } from "components/form/FormField";
import { Loader, Button, SelectField, TextField, CheckboxField, FormRow } from "@snailycad/ui";
import { Modal } from "components/modal/Modal";
import { Form, Formik, useFormikContext } from "formik";
import { handleValidate } from "lib/handleValidate";
import useFetch from "lib/useFetch";
import { useModal } from "state/modalState";
import { type PenalCode, type ValueType, PenalCodeType } from "@snailycad/types";
import { useTranslations } from "use-intl";
import { dataToSlate, Editor } from "components/editor/editor";
import { ModalIds } from "types/modal-ids";
import { useFeatureEnabled } from "hooks/useFeatureEnabled";
import type { PatchValueByIdData, PostValuesData } from "@snailycad/types/api";

interface Props {
  type: ValueType;
  penalCode: PenalCode | null;
  groupId: string;
  onCreate(newValue: PenalCode): void;
  onUpdate(oldValue: PenalCode, newValue: PenalCode): void;
  onClose(): void;
}

export function ManagePenalCode({ onCreate, onUpdate, onClose, groupId, type, penalCode }: Props) {
  const { state, execute } = useFetch();
  const modalState = useModal();
  const valuesT = useTranslations("Values");
  const t = useTranslations(type);
  const common = useTranslations("Common");
  const { LEO_BAIL } = useFeatureEnabled();

  const title = !penalCode ? t("ADD") : t("EDIT");
  const footerTitle = !penalCode ? t("ADD") : common("save");

  async function onSubmit(values: typeof INITIAL_VALUES) {
    const data = {
      descriptionData: values.descriptionData,
      title: values.title,
      warningApplicable: values.warningApplicable,
      warningNotApplicable: values.warningNotApplicable,
      warningFines: values.warningApplicable ? values.fines1.values : null,
      warningNotFines: values.warningNotApplicable ? values.fines2.values : null,
      prisonTerm: values.warningNotApplicable ? values.prisonTerm.values : null,
      bail: LEO_BAIL && values.warningNotApplicable ? values.bail.values : null,
      groupId: values.groupId === "ungrouped" || !values.groupId ? null : values.groupId,
      type: values.type,
    };

    if (penalCode) {
      const { json } = await execute<PatchValueByIdData<PenalCode>>({
        path: `/admin/values/${type.toLowerCase()}/${penalCode.id}`,
        method: "PATCH",
        data,
      });

      if (json?.id) {
        modalState.closeModal(ModalIds.ManageValue);
        onUpdate(penalCode, json);
      }
    } else {
      const { json } = await execute<PostValuesData<PenalCode>>({
        path: `/admin/values/${type.toLowerCase()}`,
        method: "POST",
        data,
      });

      if (json?.id) {
        modalState.closeModal(ModalIds.ManageValue);
        onCreate(json);
      }
    }
  }

  function handleClose() {
    modalState.closeModal(ModalIds.ManageValue);
    onClose();
  }

  const INITIAL_VALUES = {
    title: penalCode?.title ?? "",
    type: penalCode?.type ?? null,
    isPrimary: penalCode?.isPrimary ?? true,
    description: penalCode?.description ?? "",
    descriptionData: dataToSlate(penalCode),
    groupId: penalCode?.groupId ?? groupId,
    warningApplicable: Boolean(penalCode?.warningApplicableId),
    warningNotApplicable: Boolean(penalCode?.warningNotApplicableId),
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
      enabled: ((LEO_BAIL && penalCode?.warningNotApplicable?.bail.length) || 0) > 0,
      values: (LEO_BAIL && penalCode?.warningNotApplicable?.bail) ?? [],
    },
  };

  const validate = handleValidate(PENAL_CODE_SCHEMA);

  return (
    <Modal
      className="w-[1000px] min-h-[600px]"
      title={title}
      onClose={handleClose}
      isOpen={modalState.isOpen(ModalIds.ManageValue)}
    >
      <Formik validate={validate} onSubmit={onSubmit} initialValues={INITIAL_VALUES}>
        {({ setFieldValue, values, errors }) => (
          <Form>
            <TextField
              errorMessage={errors.title}
              label={common("title")}
              autoFocus
              name="title"
              onChange={(value) => setFieldValue("title", String(value))}
              value={values.title}
            />

            <SelectField
              errorMessage={errors.type}
              label={common("type")}
              name="type"
              options={Object.values(PenalCodeType).map((value) => ({
                value,
                label: valuesT(value),
              }))}
              onSelectionChange={(key) => setFieldValue("type", key)}
              isClearable={false}
              selectedKey={values.type}
            />

            <CheckboxField
              onChange={(isSelected) => setFieldValue("isPrimary", isSelected)}
              isSelected={values.isPrimary}
            >
              {valuesT("isPrimary")}
            </CheckboxField>

            <FormField errorMessage={errors.description} label={common("description")}>
              <Editor
                value={values.descriptionData}
                onChange={(v) => setFieldValue("descriptionData", v)}
              />
            </FormField>

            <FormRow>
              <div className="flex flex-col mr-2.5">
                <CheckboxField
                  onChange={(isSelected) => setFieldValue("warningApplicable", isSelected)}
                  isSelected={values.warningApplicable}
                >
                  {valuesT("warningApplicable")}
                </CheckboxField>

                <div>
                  <FieldsRow keyValue="fines1" />
                </div>
              </div>

              <div className="ml-2.5">
                <CheckboxField
                  onChange={(isSelected) => setFieldValue("warningNotApplicable", isSelected)}
                  isSelected={values.warningNotApplicable}
                >
                  {valuesT("warningNotApplicable")}
                </CheckboxField>

                <div>
                  <FieldsRow keyValue="fines2" />
                  <FieldsRow keyValue="prisonTerm" />
                  {LEO_BAIL ? <FieldsRow keyValue="bail" /> : null}
                </div>
              </div>
            </FormRow>

            <footer className="flex justify-end mt-5">
              <Button type="reset" onPress={handleClose} variant="cancel">
                {common("cancel")}
              </Button>
              <Button className="flex items-center" disabled={state === "loading"} type="submit">
                {state === "loading" ? <Loader className="mr-2" /> : null}
                {footerTitle}
              </Button>
            </footer>
          </Form>
        )}
      </Formik>
    </Modal>
  );
}

function FieldsRow({ keyValue }: { keyValue: `fines${number}` | "prisonTerm" | "bail" }) {
  const { values, setFieldValue } = useFormikContext<any>();

  const disabled = keyValue === "fines1" ? !values.warningApplicable : !values.warningNotApplicable;
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
    <FormRow>
      <CheckboxField
        onChange={(isSelected) => setFieldValue(`${keyValue}.enabled`, isSelected)}
        isSelected={values[keyValue].enabled}
        isDisabled={isBailDisabled || disabled}
      >
        {label}
      </CheckboxField>

      <FormRow className="items-center" useFlex>
        <TextField
          label="Min."
          onChange={(value) => setFieldValue(`${keyValue}.values[0]`, value)}
          isRequired
          type="number"
          name={`${keyValue}.values[0]`}
          value={values[keyValue].values[0]}
          placeholder="Min."
          className="min-w-[100px]"
          isDisabled={isDisabled}
        />

        <span className="mt-2.5">{" - "}</span>
        <TextField
          label="Max."
          onChange={(value) => setFieldValue(`${keyValue}.values[1]`, value)}
          isRequired
          type="number"
          name={`${keyValue}.values[1]`}
          value={values[keyValue].values[1]}
          placeholder="Max."
          className="min-w-[100px]"
          isDisabled={isDisabled}
        />
      </FormRow>
    </FormRow>
  );
}
