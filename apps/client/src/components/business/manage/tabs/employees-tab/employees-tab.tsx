import { useTranslations } from "use-intl";
import { Button, TabsContent } from "@snailycad/ui";
import { FullEmployee, useBusinessState } from "state/business-state";
import { useModal } from "state/modalState";
import { ModalIds } from "types/ModalIds";
import { ManageEmployeeModal } from "./manage-employee-modal";
import { Employee, EmployeeAsEnum, WhitelistStatus } from "@snailycad/types";
import { AlertModal } from "components/modal/AlertModal";
import useFetch from "lib/useFetch";
import { Table, useTableState } from "components/shared/Table";
import { yesOrNoText } from "lib/utils";
import { Status } from "components/shared/Status";
import type { DeleteBusinessFireEmployeeData } from "@snailycad/types/api";
import { useTemporaryItem } from "hooks/shared/useTemporaryItem";
import { shallow } from "zustand/shallow";

export function EmployeesTab() {
  const { state, execute } = useFetch();
  const { openModal, closeModal } = useModal();
  const common = useTranslations("Common");
  const t = useTranslations("Business");

  const { currentBusiness, currentEmployee, setCurrentBusiness } = useBusinessState(
    (state) => ({
      currentBusiness: state.currentBusiness,
      currentEmployee: state.currentEmployee,
      setCurrentBusiness: state.setCurrentBusiness,
    }),
    shallow,
  );

  const employees = currentBusiness?.employees ?? [];
  const [tempEmployee, employeeState] = useTemporaryItem(employees);
  const tableState = useTableState();

  function handleUpdate(old: FullEmployee, newE: FullEmployee) {
    if (!currentBusiness) return;

    setCurrentBusiness({
      ...currentBusiness,
      employees: currentBusiness.employees.map((em) => {
        if (em.id === old.id) {
          return newE;
        }

        return em;
      }),
    });
  }

  async function handleFireEmployee() {
    if (!tempEmployee || !currentBusiness || !currentEmployee) return;

    const { json } = await execute<DeleteBusinessFireEmployeeData>({
      path: `/businesses/employees/${currentBusiness.id}/${tempEmployee.id}`,
      data: { employeeId: currentEmployee.id },
      method: "DELETE",
    });

    if (json) {
      setCurrentBusiness({
        ...currentBusiness,
        employees: currentBusiness.employees.filter((v) => v.id !== tempEmployee.id),
      });
      employeeState.setTempId(null);
      closeModal(ModalIds.AlertFireEmployee);
    }
  }

  function handleManageClick(employee: Employee) {
    if (employee.role?.as === EmployeeAsEnum.OWNER) return;
    employeeState.setTempId(employee.id);
    openModal(ModalIds.ManageEmployee);
  }

  function handleFireClick(employee: Employee) {
    if (employee.role?.as === EmployeeAsEnum.OWNER) return;
    employeeState.setTempId(employee.id);
    openModal(ModalIds.AlertFireEmployee);
  }

  return (
    <TabsContent aria-label={t("allEmployees")} value="allEmployees">
      <h3 className="text-2xl font-semibold">{t("employees")}</h3>

      <Table
        tableState={tableState}
        data={employees.map((employee) => ({
          id: employee.id,
          name: `${employee.citizen.name} ${employee.citizen.surname}`,
          role: employee.role?.value.value ?? common("none"),
          canCreatePosts: common(yesOrNoText(employee.canCreatePosts)),
          employeeOfTheMonth: common(yesOrNoText(employee.employeeOfTheMonth)),
          whitelistStatus: <Status>{employee.whitelistStatus}</Status>,
          actions: (
            <>
              <Button
                size="xs"
                disabled={
                  employee.role?.as === EmployeeAsEnum.OWNER ||
                  employee.whitelistStatus === WhitelistStatus.PENDING
                }
                onPress={() => handleManageClick(employee)}
                variant="success"
              >
                {common("manage")}
              </Button>
              <Button
                size="xs"
                disabled={
                  employee.role?.as === EmployeeAsEnum.OWNER ||
                  employee.whitelistStatus === WhitelistStatus.PENDING
                }
                onPress={() => handleFireClick(employee)}
                className="ml-2"
                variant="danger"
              >
                {t("fire")}
              </Button>
            </>
          ),
        }))}
        columns={[
          { header: common("name"), accessorKey: "name" },
          { header: t("role"), accessorKey: "role" },
          { header: t("canCreatePosts"), accessorKey: "canCreatePosts" },
          { header: t("employeeOfTheMonth"), accessorKey: "employeeOfTheMonth" },
          { header: t("whitelistStatus"), accessorKey: "whitelistStatus" },
          { header: common("actions"), accessorKey: "actions" },
        ]}
      />

      <AlertModal
        id={ModalIds.AlertFireEmployee}
        title={t("fireEmployee")}
        description={t.rich("alert_fireEmployee", {
          employee: tempEmployee && `${tempEmployee.citizen.name} ${tempEmployee.citizen.surname}`,
        })}
        onDeleteClick={handleFireEmployee}
        deleteText={t("fire")}
        state={state}
        onClose={() => employeeState.setTempId(null)}
      />

      <ManageEmployeeModal onUpdate={handleUpdate} employee={tempEmployee} />
    </TabsContent>
  );
}
