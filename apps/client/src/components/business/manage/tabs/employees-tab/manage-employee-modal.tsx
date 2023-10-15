import { Loader, Button, SwitchField, FormRow, SelectField } from "@snailycad/ui";
import { Modal } from "components/modal/Modal";
import { useModal } from "state/modalState";
import { Form, Formik, type FormikHelpers } from "formik";
import useFetch from "lib/useFetch";
import { useBusinessState } from "state/business-state";
import { ModalIds } from "types/modal-ids";
import { useTranslations } from "use-intl";
import { UPDATE_EMPLOYEE_SCHEMA } from "@snailycad/schemas";
import { handleValidate } from "lib/handleValidate";
import { useValues } from "context/ValuesContext";
import { type Employee, EmployeeAsEnum } from "@snailycad/types";
import type { PutBusinessEmployeesData } from "@snailycad/types/api";

interface Props {
  isAdmin?: boolean;
  employee: Employee | null;
  onUpdate(old: Employee, newPost: Employee): void;
  onClose?(): void;
}

export function ManageEmployeeModal({ onClose, onUpdate, employee, isAdmin }: Props) {
  const { currentBusiness, currentEmployee } = useBusinessState((state) => ({
    currentBusiness: state.currentBusiness,
    currentEmployee: state.currentEmployee,
  }));

  const modalState = useModal();
  const { state, execute } = useFetch();
  const common = useTranslations("Common");
  const t = useTranslations("Business");

  const { businessRole } = useValues();
  const valueRoles = businessRole.values;
  const businessRoles = currentBusiness?.roles ?? [];
  const rolesToSelect = businessRoles.length <= 0 ? valueRoles : businessRoles;

  if (!isAdmin && (!currentBusiness || !currentEmployee)) {
    return null;
  }

  function handleClose() {
    modalState.closeModal(ModalIds.ManageEmployee);
    onClose?.();
  }

  async function onSubmit(
    values: typeof INITIAL_VALUES,
    helpers: FormikHelpers<typeof INITIAL_VALUES>,
  ) {
    if (!isAdmin && (!currentEmployee || !currentBusiness)) return;
    if (!employee) return;

    const businessId = isAdmin ? employee.businessId : currentBusiness?.id;
    const employeeId = isAdmin ? employee.id : currentEmployee?.id;

    const adminPath = `/admin/manage/businesses/employees/${employee.id}`;
    const regularPath = `/businesses/employees/${businessId}/${employee.id}`;
    const updatePath = isAdmin ? adminPath : regularPath;

    const { json } = await execute<PutBusinessEmployeesData, typeof INITIAL_VALUES>({
      path: updatePath,
      method: "PUT",
      data: { ...values, employeeId },
      helpers,
    });

    if (json.id) {
      modalState.closeModal(ModalIds.ManageEmployee);
      onUpdate(employee, { ...employee, ...json });
    }
  }

  const filteredRoles = isAdmin
    ? rolesToSelect
    : rolesToSelect.filter((v) => v.as !== EmployeeAsEnum.OWNER);

  const validate = handleValidate(UPDATE_EMPLOYEE_SCHEMA);
  const INITIAL_VALUES = {
    employeeId: employee?.id ?? "",
    canCreatePosts: employee?.canCreatePosts ?? true,
    employeeOfTheMonth: employee?.employeeOfTheMonth ?? false,
    canManageEmployees: employee?.canManageEmployees ?? false,
    canManageVehicles: employee?.canManageVehicles ?? false,
    roleId: employee?.roleId ?? null,
  };

  return (
    <Modal
      className="w-[600px]"
      title={t("manageEmployee")}
      isOpen={modalState.isOpen(ModalIds.ManageEmployee)}
      onClose={handleClose}
    >
      <Formik validate={validate} onSubmit={onSubmit} initialValues={INITIAL_VALUES}>
        {({ setFieldValue, errors, values, isValid }) => (
          <Form>
            <SelectField
              errorMessage={errors.roleId}
              label={t("role")}
              options={filteredRoles.map((v) => ({
                label: v.value?.value,
                value: v.id,
              }))}
              onSelectionChange={(key) => setFieldValue("roleId", key)}
              selectedKey={values.roleId}
            />

            <FormRow>
              <SwitchField
                isSelected={values.canManageEmployees}
                onChange={(isSelected) => setFieldValue("canManageEmployees", isSelected)}
              >
                {t("canManageEmployees")}
              </SwitchField>

              <SwitchField
                isSelected={values.canManageVehicles}
                onChange={(isSelected) => setFieldValue("canManageVehicles", isSelected)}
              >
                {t("canManageVehicles")}
              </SwitchField>
            </FormRow>

            <FormRow>
              <SwitchField
                isSelected={values.canCreatePosts}
                onChange={(isSelected) => setFieldValue("canCreatePosts", isSelected)}
              >
                {t("canCreatePosts")}
              </SwitchField>

              <SwitchField
                isSelected={values.employeeOfTheMonth}
                onChange={(isSelected) => setFieldValue("employeeOfTheMonth", isSelected)}
              >
                {t("employeeOfTheMonth")}
              </SwitchField>
            </FormRow>

            <footer className="flex justify-end mt-5">
              <Button type="reset" onPress={handleClose} variant="cancel">
                {common("cancel")}
              </Button>
              <Button
                className="flex items-center"
                disabled={!isValid || state === "loading"}
                type="submit"
              >
                {state === "loading" ? <Loader className="mr-2" /> : null}
                {common("save")}
              </Button>
            </footer>
          </Form>
        )}
      </Formik>
    </Modal>
  );
}
