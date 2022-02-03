import { Button } from "components/Button";
import { FormField } from "components/form/FormField";
import { Loader } from "components/Loader";
import { Modal } from "components/modal/Modal";
import { useModal } from "context/ModalContext";
import { Form, Formik, FormikHelpers } from "formik";
import useFetch from "lib/useFetch";
import { FullEmployee, useBusinessState } from "state/businessState";
import { ModalIds } from "types/ModalIds";
import { useTranslations } from "use-intl";
import { UPDATE_EMPLOYEE_SCHEMA } from "@snailycad/schemas";
import { handleValidate } from "lib/handleValidate";
import { Toggle } from "components/form/Toggle";
import { Select } from "components/form/Select";
import { FormRow } from "components/form/FormRow";
import { useValues } from "context/ValuesContext";
import { EmployeeAsEnum } from "@snailycad/types";

interface Props {
  onUpdate: (old: FullEmployee, newPost: FullEmployee) => void;
  onClose?(): void;
  employee: FullEmployee | null;
}

export function ManageEmployeeModal({ onClose, onUpdate, employee }: Props) {
  const { currentBusiness, currentEmployee } = useBusinessState();
  const { isOpen, closeModal } = useModal();
  const { state, execute } = useFetch();
  const common = useTranslations("Common");
  const t = useTranslations("Business");

  const { businessRole } = useValues();

  if (!currentBusiness || !currentEmployee) {
    return null;
  }

  function handleClose() {
    closeModal(ModalIds.ManageEmployee);
    onClose?.();
  }

  async function onSubmit(
    values: typeof INITIAL_VALUES,
    helpers: FormikHelpers<typeof INITIAL_VALUES>,
  ) {
    if (!currentEmployee || !currentBusiness) return;
    if (!employee) return;

    const { json } = await execute(`/businesses/employees/${currentBusiness.id}/${employee.id}`, {
      method: "PUT",
      data: { ...values, employeeId: currentEmployee.id },
      helpers,
    });

    if (json.id) {
      closeModal(ModalIds.ManageEmployee);
      onUpdate(employee, json);
    }
  }

  const filteredRoles =
    employee?.role.as === EmployeeAsEnum.OWNER
      ? businessRole.values
      : businessRole.values.filter((v) => v.as !== EmployeeAsEnum.OWNER);

  const validate = handleValidate(UPDATE_EMPLOYEE_SCHEMA);
  const INITIAL_VALUES = {
    employeeId: employee?.id ?? "",
    canCreatePosts: employee?.canCreatePosts ?? true,
    employeeOfTheMonth: employee?.employeeOfTheMonth ?? false,
    roleId: employee?.roleId ?? null,
  };

  return (
    <Modal
      className="w-[600px]"
      title={t("manageEmployee")}
      isOpen={isOpen(ModalIds.ManageEmployee)}
      onClose={handleClose}
    >
      <Formik validate={validate} onSubmit={onSubmit} initialValues={INITIAL_VALUES}>
        {({ handleChange, errors, values, isValid }) => (
          <Form>
            <FormField errorMessage={errors.roleId} label={t("role")}>
              <Select
                name="roleId"
                onChange={handleChange}
                value={values.roleId}
                values={filteredRoles.map((v) => ({
                  label: v.value?.value,
                  value: v.id,
                }))}
              />
            </FormField>

            <FormRow>
              <FormField errorMessage={errors.canCreatePosts} label={t("canCreatePosts")}>
                <Toggle
                  name="canCreatePosts"
                  onClick={handleChange}
                  toggled={values.canCreatePosts}
                />
              </FormField>

              <FormField errorMessage={errors.employeeOfTheMonth} label={t("employeeOfTheMonth")}>
                <Toggle
                  name="employeeOfTheMonth"
                  onClick={handleChange}
                  toggled={values.employeeOfTheMonth}
                />
              </FormField>
            </FormRow>

            <footer className="flex justify-end mt-5">
              <Button type="reset" onClick={handleClose} variant="cancel">
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
