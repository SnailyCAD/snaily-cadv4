import { Button } from "components/Button";
import { FormField } from "components/form/FormField";
import { Input } from "components/form/inputs/Input";
import { Loader } from "components/Loader";
import { Modal } from "components/modal/Modal";
import { Formik, FormikHelpers } from "formik";
import { handleValidate } from "lib/handleValidate";
import useFetch from "lib/useFetch";
import { useModal } from "context/ModalContext";
import { CustomField, CustomFieldCategory } from "@snailycad/types";
import { useTranslations } from "use-intl";
import { Select } from "components/form/Select";
import { ModalIds } from "types/ModalIds";

interface Props {
  field: CustomField | null;
}
const CUSTOM_FIELDS_SCHEMA = {};

const CATEGORIES = Object.values(CustomFieldCategory).map((v) => ({
  label: v.toLowerCase(),
  value: v,
}));

export function ManageCustomFieldModal({ field }: Props) {
  const { state, execute } = useFetch();
  const { isOpen, closeModal } = useModal();
  const common = useTranslations("Common");

  async function onSubmit(
    values: typeof INITIAL_VALUES,
    helpers: FormikHelpers<typeof INITIAL_VALUES>,
  ) {
    if (field) {
      const { json } = await execute(`/admin/custom-fields/${field.id}`, {
        method: "PATCH",
        data: values,
        helpers,
      });

      if (json?.id) {
        closeModal(ModalIds.ManageCustomField);
        onUpdate(field, json);
      }
    } else {
      const { json } = await execute("/admin/manage/custom-fields", {
        method: "POST",
        data: values,
        helpers,
      });

      if (json?.id) {
        closeModal(ModalIds.ManageCustomField);
        onCreate(json);
      }
    }
  }

  const INITIAL_VALUES = {
    name: field?.name ?? "",
    category: field?.category ?? "",
  };

  const validate = handleValidate(CUSTOM_FIELDS_SCHEMA);
  return (
    <Modal
      className="w-[600px]"
      title={"ToDO"}
      onClose={() => closeModal(ModalIds.ManageCustomField)}
      isOpen={isOpen(ModalIds.ManageCustomField)}
    >
      <Formik validate={validate} onSubmit={onSubmit} initialValues={INITIAL_VALUES}>
        {({ handleSubmit, handleChange, values, errors }) => (
          <form onSubmit={handleSubmit}>
            <FormField errorMessage={errors.name} label="Name">
              <Input autoFocus name="name" onChange={handleChange} value={values.name} />
            </FormField>

            <FormField label="Category">
              <Select
                values={CATEGORIES}
                name="category"
                onChange={handleChange}
                value={values.category}
              />
            </FormField>

            <footer className="flex justify-end mt-5">
              <Button
                type="reset"
                onClick={() => closeModal(ModalIds.ManageCustomField)}
                variant="cancel"
              >
                Cancel
              </Button>
              <Button className="flex items-center" disabled={state === "loading"} type="submit">
                {state === "loading" ? <Loader className="mr-2" /> : null}
                {field ? common("save") : common("create")}
              </Button>
            </footer>
          </form>
        )}
      </Formik>
    </Modal>
  );
}
