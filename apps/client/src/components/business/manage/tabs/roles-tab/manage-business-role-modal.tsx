import { Loader, Button, SelectField, TextField } from "@snailycad/ui";
import { Modal } from "components/modal/Modal";
import { Form, Formik, type FormikHelpers } from "formik";
import { handleValidate } from "lib/handleValidate";
import useFetch from "lib/useFetch";
import { useModal } from "state/modalState";
import { EmployeeAsEnum, type EmployeeValue } from "@snailycad/types";
import { useTranslations } from "use-intl";
import { ModalIds } from "types/modal-ids";
import { getValueStrFromValue } from "lib/admin/values/utils";
import { useBusinessState } from "state/business-state";
import { BUSINESSES_BUSINESS_ROLE_SCHEMA } from "@snailycad/schemas";

interface Props {
  value: EmployeeValue | null;
  onCreate(newValue: EmployeeValue): void;
  onUpdate(oldValue: EmployeeValue, newValue: EmployeeValue): void;
  onClose(): void;
}

const BUSINESS_VALUES = [
  {
    value: EmployeeAsEnum.MANAGER,
    label: "Manager",
  },
  {
    value: EmployeeAsEnum.EMPLOYEE,
    label: "Employee",
  },
];

export function ManageBusinessRoleModal({ onCreate, onUpdate, onClose, value }: Props) {
  const { currentBusiness, currentEmployee } = useBusinessState((state) => ({
    currentBusiness: state.currentBusiness,
    currentEmployee: state.currentEmployee,
  }));

  const { state, execute } = useFetch();
  const modalState = useModal();
  const t = useTranslations("Business");
  const common = useTranslations("Common");

  const title = !value ? t("addBusinessRole") : t("editBusinessRole");
  const footerTitle = !value ? t("addBusinessRole") : common("save");

  function handleClose() {
    onClose();
    modalState.closeModal(ModalIds.ManageBusinessRole);
  }

  async function onSubmit(
    values: typeof INITIAL_VALUES,
    helpers: FormikHelpers<typeof INITIAL_VALUES>,
  ) {
    if (value) {
      const { json } = await execute<any, typeof INITIAL_VALUES>({
        path: `/businesses/roles/${currentBusiness?.id}/${value.id}?employeeId=${currentEmployee?.id}`,
        method: "PUT",
        data: values,
        helpers,
      });

      if (json?.id) {
        modalState.closeModal(ModalIds.ManageBusinessRole);
        onUpdate(value, json);
      }
    } else {
      const { json } = await execute<any, typeof INITIAL_VALUES>({
        path: `/businesses/roles/${currentBusiness?.id}?employeeId=${currentEmployee?.id}`,
        method: "POST",
        data: values,
        helpers,
      });

      if (json?.id) {
        modalState.closeModal(ModalIds.ManageBusinessRole);
        onCreate(json);
      }
    }
  }

  const INITIAL_VALUES = {
    value: value ? getValueStrFromValue(value) : "",
    as: value?.as ?? null,
  };

  const validate = handleValidate(BUSINESSES_BUSINESS_ROLE_SCHEMA);

  return (
    <Modal
      className="w-[600px]"
      title={title}
      onClose={handleClose}
      isOpen={modalState.isOpen(ModalIds.ManageBusinessRole)}
    >
      <Formik validate={validate} onSubmit={onSubmit} initialValues={INITIAL_VALUES}>
        {({ setFieldValue, values, errors }) => (
          <Form>
            <TextField
              errorMessage={errors.value}
              label="Value"
              autoFocus
              name="value"
              onChange={(value) => setFieldValue("value", value)}
              value={values.value}
            />

            <SelectField
              errorMessage={errors.as}
              label="As (this is so the database knows what to use.)"
              options={BUSINESS_VALUES}
              name="as"
              onSelectionChange={(key) => setFieldValue("as", key)}
              selectedKey={values.as}
            />

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
