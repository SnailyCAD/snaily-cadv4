import { TabsContent } from "components/shared/TabList";
import { useTranslations } from "use-intl";
import { Button } from "@snailycad/ui";
import { useBusinessState } from "state/businessState";
import { Employee, WhitelistStatus } from "@snailycad/types";
import useFetch from "lib/useFetch";
import { Table, useTableState } from "components/shared/Table";
import type { PutBusinessEmployeesData } from "@snailycad/types/api";

export function PendingEmployeesTab() {
  const { state, execute } = useFetch();
  const common = useTranslations("Common");
  const t = useTranslations("Business");
  const tableState = useTableState();

  const { currentBusiness, currentEmployee, setCurrentBusiness } = useBusinessState();

  const employees =
    currentBusiness?.employees.filter((v) => v.whitelistStatus === WhitelistStatus.PENDING) ?? [];

  async function handleUpdate(employee: Employee, type: "accept" | "decline") {
    if (!currentBusiness || !currentEmployee) return;

    const { json } = await execute<PutBusinessEmployeesData>({
      path: `/businesses/employees/${currentBusiness.id}/${employee.id}/${type}`,
      method: "PUT",
      data: { employeeId: currentEmployee.id },
    });

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
          <Table
            tableState={tableState}
            data={employees.map((employee) => ({
              id: employee.id,
              citizen: `${employee.citizen.surname} ${employee.citizen.name}`,
              actions: (
                <div>
                  <Button
                    disabled={state === "loading"}
                    onPress={() => handleUpdate(employee, "accept")}
                    variant="success"
                    size="xs"
                  >
                    {common("accept")}
                  </Button>
                  <Button
                    disabled={state === "loading"}
                    onPress={() => handleUpdate(employee, "decline")}
                    className="ml-2"
                    size="xs"
                    variant="danger"
                  >
                    {common("decline")}
                  </Button>
                </div>
              ),
            }))}
            columns={[
              { header: common("citizen"), accessorKey: "citizen" },
              { header: common("actions"), accessorKey: "actions" },
            ]}
          />
        )}
      </ul>
    </TabsContent>
  );
}
