import { PENAL_CODE_SCHEMA } from "@snailycad/schemas";
import { FormField } from "components/form/FormField";
import { Loader, Button, SelectField, TextField, Input } from "@snailycad/ui";
import { Modal } from "components/modal/Modal";
import { Form, Formik, useFormikContext } from "formik";
import { handleValidate } from "lib/handleValidate";
import useFetch from "lib/useFetch";
import { useModal } from "state/modalState";
import { PenalCode, ValueType, PenalCodeType } from "@snailycad/types";
import { useTranslations } from "use-intl";
import { FormRow } from "components/form/FormRow";
import { dataToSlate, Editor } from "components/editor/editor";
import { ModalIds } from "types/ModalIds";
import { useFeatureEnabled } from "hooks/useFeatureEnabled";
import { Checkbox } from "components/form/inputs/Checkbox";
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
  const { isOpen, closeModal } = useModal();
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
        closeModal(ModalIds.ManageValue);
        onUpdate(penalCode, json);
      }
    } else {
      const { json } = await execute<PostValuesData<PenalCode>>({
        path: `/admin/values/${type.toLowerCase()}`,
        method: "POST",
        data,
      });

      if (json?.id) {
        closeModal(ModalIds.ManageValue);
        onCreate(json);
      }
    }
  }

  function handleClose() {
    closeModal(ModalIds.ManageValue);
    onClose();
  }

  const INITIAL_VALUES = {
    title: penalCode?.title ?? "",
    type: penalCode?.type ?? null,
    isPrimary: penalCode?.isPrimary ?? true,
    description: penalCode?.description ?? "",
    descriptionData: dataToSlate(penalCode),
    groupId: penalCode?.groupId ?? groupId,
    warningApplicable: !!penalCode?.warningApplicableId,
    warningNotApplicable: !!penalCode?.warningNotApplicableId,
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
      isOpen={isOpen(ModalIds.ManageValue)}
    >
      <Formik validate={validate} onSubmit={onSubmit} initialValues={INITIAL_VALUES}>
        {({ setFieldValue, values, errors }) => (
          <Form>
            <TextField
              errorMessage={errors.title}
              label="Title"
              autoFocus
              name="title"
              onChange={(value) => setFieldValue("title", String(value))}
              value={values.title}
            />

            <SelectField
              errorMessage={errors.type}
              label="Type"
              name="type"
              options={Object.values(PenalCodeType).map((value) => ({
                value,
                label: value.toLowerCase(),
              }))}
              onSelectionChange={(key) => setFieldValue("type", key)}
              isClearable={false}
              selectedKey={values.type}
            />

            <FormField checkbox errorMessage={errors.isPrimary} label="Is Primary">
              <Input
                checked={values.isPrimary}
                name="type"
                onChange={(e) => setFieldValue("isPrimary", e.target.checked)}
                type="checkbox"
              />
            </FormField>

            <FormField errorMessage={errors.description} label="Description">
              <Editor
                value={values.descriptionData}
                onChange={(v) => setFieldValue("descriptionData", v)}
              />
            </FormField>

            <FormRow>
              <div className="flex flex-col mr-2.5">
                <FormField checkbox label="Warning applicable">
                  <Checkbox
                    checked={values.warningApplicable}
                    onChange={() => setFieldValue("warningApplicable", !values.warningApplicable)}
                  />
                </FormField>

                <div>
                  <FieldsRow keyValue="fines1" />
                </div>
              </div>

              <div className="ml-2.5">
                <FormField checkbox label="Warning not applicable">
                  <Checkbox
                    checked={values.warningNotApplicable}
                    onChange={() =>
                      setFieldValue("warningNotApplicable", !values.warningNotApplicable)
                    }
                  />
                </FormField>

                <div>
                  <FieldsRow keyValue="fines2" />
                  <FieldsRow keyValue="prisonTerm" />
                  {LEO_BAIL ? <FieldsRow keyValue="bail" /> : null}
                </div>
              </div>
            </FormRow>

            <footer className="flex justify-end mt-5">
              <Button type="reset" onPress={handleClose} variant="cancel">
                Cancel
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
    <FormRow className="mb-0">
      <FormField className="mb-0" checkbox label={label}>
        <Checkbox
          disabled={isBailDisabled || disabled}
          onChange={() => setFieldValue(`${keyValue}.enabled`, !values[keyValue].enabled)}
          checked={values[keyValue].enabled}
        />
      </FormField>

      <FormRow className="items-center" flexLike>
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

        <span className="mb-2.5">{" - "}</span>
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
