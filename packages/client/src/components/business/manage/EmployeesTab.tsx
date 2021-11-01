import * as React from "react";
import { Tab } from "@headlessui/react";
import { useTranslations } from "use-intl";
import { Button } from "components/Button";
import { FullEmployee, useBusinessState } from "state/businessState";
import { useModal } from "context/ModalContext";
import { ModalIds } from "types/ModalIds";
import { ManageEmployeeModal } from "./ManageEmployeeModal";
import { EmployeeAsEnum } from "types/prisma";
import { AlertModal } from "components/modal/AlertModal";
import useFetch from "lib/useFetch";

export const EmployeesTab = () => {
  const [tempEmployee, setTempEmployee] = React.useState<FullEmployee | null>(null);

  const { state, execute } = useFetch();
  const { openModal, closeModal } = useModal();
  const common = useTranslations("Common");
  const t = useTranslations("Business");

  const { currentBusiness, currentEmployee, setCurrentBusiness } = useBusinessState();

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
    setTempEmployee(employee);
    openModal(ModalIds.ManageEmployee);
  }

  function handleFireClick(employee: FullEmployee) {
    setTempEmployee(employee);
    openModal(ModalIds.AlertFireEmployee);
  }

  return (
    <Tab.Panel className="mt-3">
      <h3 className="text-2xl font-semibold">{t("employees")}</h3>

      <ul className="space-y-3 mt-3">
        {currentBusiness?.employees.map((employee) => (
          <li
            className="bg-gray-200/60 rounded-md p-4 flex items-baseline justify-between"
            key={employee.id}
          >
            <div>
              <span className="font-semibold text-xl">
                {employee.citizen.name} {employee.citizen.surname}
              </span>
              <p>
                <span className="font-semibold">{t("role")}: </span>
                {employee.role?.value?.value}
              </p>
              <p>
                <span className="font-semibold">{t("canCreatePosts")}: </span>
                {String(employee.canCreatePosts)}
              </p>
              <p>
                <span className="font-semibold">{t("employeeOfTheMonth")}: </span>
                {String(employee.employeeOfTheMonth)}
              </p>
              <p>
                <span className="font-semibold">{t("whitelistStatus")}: </span>
                {String(employee.whitelistStatus)}
              </p>
            </div>

            {employee.role.as !== EmployeeAsEnum.OWNER ? (
              <div>
                <Button onClick={() => handleManageClick(employee)} variant="success">
                  {common("manage")}
                </Button>
                <Button onClick={() => handleFireClick(employee)} className="ml-2" variant="danger">
                  {t("fire")}
                </Button>
              </div>
            ) : null}
          </li>
        ))}
      </ul>

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
    </Tab.Panel>
  );
};
