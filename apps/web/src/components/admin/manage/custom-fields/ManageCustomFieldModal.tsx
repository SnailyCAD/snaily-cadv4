import { Button } from "components/Button";
import { FormField } from "components/form/FormField";
import { Input } from "components/form/inputs/Input";
import { Loader } from "components/Loader";
import { Modal } from "components/modal/Modal";
import { Form, Formik, FormikHelpers } from "formik";
import { handleValidate } from "lib/handleValidate";
import useFetch from "lib/useFetch";
import { useModal } from "state/modalState";
import { CustomField, CustomFieldCategory } from "@snailycad/types";
import { useTranslations } from "use-intl";
import { Select } from "components/form/Select";
import { ModalIds } from "types/ModalIds";
import { CUSTOM_FIELDS_SCHEMA } from "@snailycad/schemas";
import type { POstManageCustomFieldsData, PutManageCustomFieldsData } from "@snailycad/types/api";

interface Props {
  field: CustomField | null;
  onClose?(): void;
  onUpdate?(old: CustomField, newField: CustomField): void;
  onCreate?(newField: CustomField): void;
}

const CATEGORIES = Object.values(CustomFieldCategory).map((v) => ({
  label: v.toLowerCase(),
  value: v,
}));

export function ManageCustomFieldModal({ field, onClose, onCreate, onUpdate }: Props) {
  const { state, execute } = useFetch();
  const { isOpen, closeModal } = useModal();
  const common = useTranslations("Common");
  const t = useTranslations("Management");

  function handleClose() {
    onClose?.();
    closeModal(ModalIds.ManageCustomField);
  }

  async function onSubmit(
    values: typeof INITIAL_VALUES,
    helpers: FormikHelpers<typeof INITIAL_VALUES>,
  ) {
    if (field) {
      const { json } = await execute<PutManageCustomFieldsData, typeof INITIAL_VALUES>({
        path: `/admin/manage/custom-fields/${field.id}`,
        method: "PUT",
        data: values,
        helpers,
      });

      if (json?.id) {
        closeModal(ModalIds.ManageCustomField);
        onUpdate?.(field, json);
      }
    } else {
      const { json } = await execute<POstManageCustomFieldsData, typeof INITIAL_VALUES>({
        path: "/admin/manage/custom-fields",
        method: "POST",
        data: values,
        helpers,
      });

      if (json?.id) {
        closeModal(ModalIds.ManageCustomField);
        onCreate?.(json);
      }
    }
  }

  const INITIAL_VALUES = {
    name: field?.name ?? "",
    category: field?.category ?? "",
    citizenEditable: false,
  };

  const validate = handleValidate(CUSTOM_FIELDS_SCHEMA);
  return (
    <Modal
      className="w-[600px]"
      title={field ? t("editCustomField") : t("createCustomField")}
      onClose={handleClose}
      isOpen={isOpen(ModalIds.ManageCustomField)}
    >
      <Formik validate={validate} onSubmit={onSubmit} initialValues={INITIAL_VALUES}>
        {({ handleChange, values, errors }) => (
          <Form>
            <FormField errorMessage={errors.name} label={common("name")}>
              <Input autoFocus name="name" onChange={handleChange} value={values.name} />
            </FormField>

            <FormField errorMessage={errors.category} label="Category">
              <Select
                values={CATEGORIES}
                name="category"
                onChange={handleChange}
                value={values.category}
              />
            </FormField>

            <footer className="flex justify-end mt-5">
              <Button type="reset" onClick={handleClose} variant="cancel">
                Cancel
              </Button>
              <Button className="flex items-center" disabled={state === "loading"} type="submit">
                {state === "loading" ? <Loader className="mr-2" /> : null}
                {field ? common("save") : common("create")}
              </Button>
            </footer>
          </Form>
        )}
      </Formik>
    </Modal>
  );
}
