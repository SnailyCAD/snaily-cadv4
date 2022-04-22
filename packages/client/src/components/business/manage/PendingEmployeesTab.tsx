import { TabsContent } from "components/shared/TabList";
import { useTranslations } from "use-intl";
import { Button } from "components/Button";
import { FullEmployee, useBusinessState } from "state/businessState";
import { WhitelistStatus } from "@snailycad/types";
import useFetch from "lib/useFetch";
import { Table } from "components/shared/Table";

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
          <Table
            data={employees.map((employee) => ({
              citizen: `${employee.citizen.surname} ${employee.citizen.name}`,
              actions: (
                <div>
                  <Button
                    disabled={state === "loading"}
                    onClick={() => handleUpdate(employee, "accept")}
                    variant="success"
                    small
                  >
                    {common("accept")}
                  </Button>
                  <Button
                    disabled={state === "loading"}
                    onClick={() => handleUpdate(employee, "decline")}
                    className="ml-2"
                    small
                    variant="danger"
                  >
                    {common("decline")}
                  </Button>
                </div>
              ),
            }))}
            columns={[
              { Header: common("citizen"), accessor: "citizen" },
              { Header: common("actions"), accessor: "actions" },
            ]}
          />
        )}
      </ul>
    </TabsContent>
  );
}
