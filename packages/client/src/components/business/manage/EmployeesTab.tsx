import * as React from "react";
import { TabsContent } from "components/shared/TabList";
import { useTranslations } from "use-intl";
import { Button } from "components/Button";
import { FullEmployee, useBusinessState } from "state/businessState";
import { useModal } from "context/ModalContext";
import { ModalIds } from "types/ModalIds";
import { ManageEmployeeModal } from "./ManageEmployeeModal";
import { EmployeeAsEnum } from "@snailycad/types";
import { AlertModal } from "components/modal/AlertModal";
import useFetch from "lib/useFetch";
import { Table } from "components/shared/Table";
import { yesOrNoText } from "lib/utils";

export function EmployeesTab() {
  const [tempEmployee, setTempEmployee] = React.useState<FullEmployee | null>(null);

  const { state, execute } = useFetch();
  const { openModal, closeModal } = useModal();
  const common = useTranslations("Common");
  const t = useTranslations("Business");

  const { currentBusiness, currentEmployee, setCurrentBusiness } = useBusinessState();
  const employees = currentBusiness?.employees ?? [];

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

    const { json } = await execute(
      `/businesses/employees/${currentBusiness.id}/${tempEmployee.id}`,
      {
        data: { employeeId: currentEmployee.id },
        method: "DELETE",
      },
    );

    if (json) {
      setCurrentBusiness({
        ...currentBusiness,
        employees: currentBusiness.employees.filter((v) => v.id !== tempEmployee.id),
      });
      setTempEmployee(null);
      closeModal(ModalIds.AlertFireEmployee);
    }
  }

  function handleManageClick(employee: FullEmployee) {
    if (employee.role.as === EmployeeAsEnum.OWNER) return;
    setTempEmployee(employee);
    openModal(ModalIds.ManageEmployee);
  }

  function handleFireClick(employee: FullEmployee) {
    if (employee.role.as === EmployeeAsEnum.OWNER) return;
    setTempEmployee(employee);
    openModal(ModalIds.AlertFireEmployee);
  }

  return (
    <TabsContent aria-label={t("allEmployees")} value="allEmployees">
      <h3 className="text-2xl font-semibold">{t("employees")}</h3>

      <Table
        data={employees.map((employee) => ({
          name: `${employee.citizen.name} ${employee.citizen.surname}`,
          role: employee.role.value.value,
          canCreatePosts: common(yesOrNoText(employee.canCreatePosts)),
          employeeOfTheMonth: common(yesOrNoText(employee.employeeOfTheMonth)),
          whitelistStatus: (
            <span className="capitalize">{employee.whitelistStatus.toLowerCase()}</span>
          ),
          actions: (
            <>
              <Button
                small
                disabled={employee.role.as === EmployeeAsEnum.OWNER}
                onClick={() => handleManageClick(employee)}
                variant="success"
              >
                {common("manage")}
              </Button>
              <Button
                small
                disabled={employee.role.as === EmployeeAsEnum.OWNER}
                onClick={() => handleFireClick(employee)}
                className="ml-2"
                variant="danger"
              >
                {t("fire")}
              </Button>
            </>
          ),
        }))}
        columns={[
          { Header: common("name"), accessor: "name" },
          { Header: t("role"), accessor: "role" },
          { Header: t("canCreatePosts"), accessor: "canCreatePosts" },
          { Header: t("employeeOfTheMonth"), accessor: "employeeOfTheMonth" },
          { Header: t("whitelistStatus"), accessor: "whitelistStatus" },
          { Header: common("actions"), accessor: "actions" },
        ]}
      />

      <AlertModal
        id={ModalIds.AlertFireEmployee}
        title={t("fireEmployee")}
        description={t.rich("alert_fireEmployee", {
          employee: tempEmployee && `${tempEmployee.citizen.name} ${tempEmployee.citizen.surname}`,
          span: (children) => <span className="font-semibold">{children}</span>,
        })}
        onDeleteClick={handleFireEmployee}
        deleteText={t("fire")}
        state={state}
        onClose={() => setTempEmployee(null)}
      />

      <ManageEmployeeModal onUpdate={handleUpdate} employee={tempEmployee} />
    </TabsContent>
  );
}
