import { TabsContent } from "components/shared/TabList";
import { useTranslations } from "use-intl";
import { Button } from "components/Button";
import { FullEmployee, useBusinessState } from "state/businessState";
import { EmployeeAsEnum, WhitelistStatus } from "@snailycad/types";
import useFetch from "lib/useFetch";

export function PendingEmployeesTab() {
  const { state, execute } = useFetch();
  const common = useTranslations("Common");
  const t = useTranslations("Business");

  const { currentBusiness, currentEmployee, setCurrentBusiness } = useBusinessState();

  const employees =
    currentBusiness?.employees.filter((v) => v.whitelistStatus === WhitelistStatus.PENDING) ?? [];

  async function handleUpdate(employee: FullEmployee, type: "accept" | "decline") {
    if (!currentBusiness || !currentEmployee) return;

    const { json } = await execute(
      `/businesses/employees/${currentBusiness.id}/${employee.id}/${type}`,
      {
        method: "PUT",
        data: { employeeId: currentEmployee.id },
      },
    );

    if (json.id) {
      setCurrentBusiness({
        ...currentBusiness,
        employees: currentBusiness.employees.map((em) => {
          if (em.id === employee.id) {
            return { ...employee, ...json };
          }

          return em;
        }),
      });
    }
  }

  return (
    <TabsContent aria-label={t("pendingEmployees")} value="pendingEmployees">
      <h3 className="text-2xl font-semibold">{t("pendingEmployees")}</h3>

      <ul className="mt-3 space-y-3">
        {employees.length <= 0 ? (
          <p>{t("noPendingEmployees")}</p>
        ) : (
          employees.map((employee) => (
            <li className="flex items-baseline justify-between p-4 card" key={employee.id}>
              <div>
                <span className="text-xl font-semibold">
                  {employee.citizen.surname} {employee.citizen.name}
                </span>
              </div>

              {employee.role.as !== EmployeeAsEnum.OWNER ? (
                <div>
                  <Button
                    disabled={state === "loading"}
                    onClick={() => handleUpdate(employee, "accept")}
                    variant="success"
                  >
                    {common("accept")}
                  </Button>
                  <Button
                    disabled={state === "loading"}
                    onClick={() => handleUpdate(employee, "decline")}
                    className="ml-2"
                    variant="danger"
                  >
                    {common("decline")}
                  </Button>
                </div>
              ) : null}
            </li>
          ))
        )}
      </ul>
    </TabsContent>
  );
}
