import { Loader, Button, TextField, SelectField } from "@snailycad/ui";
import { Modal } from "components/modal/Modal";
import { Form, Formik, FormikHelpers } from "formik";
import { handleValidate } from "lib/handleValidate";
import useFetch from "lib/useFetch";
import { useModal } from "state/modalState";
import { CustomField, CustomFieldCategory } from "@snailycad/types";
import { useTranslations } from "use-intl";
import { ModalIds } from "types/ModalIds";
import { CUSTOM_FIELDS_SCHEMA } from "@snailycad/schemas";
import type { PostManageCustomFieldsData, PutManageCustomFieldsData } from "@snailycad/types/api";

interface Props {
  field: CustomField | null;
  onClose?(): void;
  onUpdate?(newField: CustomField): void;
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
        onUpdate?.(json);
      }
    } else {
      const { json } = await execute<PostManageCustomFieldsData, typeof INITIAL_VALUES>({
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
        {({ setFieldValue, values, errors }) => (
          <Form>
            <TextField
              errorMessage={errors.name}
              label={common("name")}
              autoFocus
              name="name"
              onChange={(value) => setFieldValue("name", value)}
              value={values.name}
            />

            <SelectField
              errorMessage={errors.category}
              label="Category"
              options={CATEGORIES}
              name="category"
              onSelectionChange={(key) => setFieldValue("category", key)}
              selectedKey={values.category}
            />

            <footer className="flex justify-end mt-5">
              <Button type="reset" onPress={handleClose} variant="cancel">
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
