import type { BaseCitizen } from "@snailycad/types";
import { Button, TabsContent } from "@snailycad/ui";
import { Table, useTableState } from "components/shared/Table";
import { yesOrNoText } from "lib/utils";
import { useModal } from "state/modalState";
import { useBusinessSearch } from "state/search/business-search-state";
import { ModalIds } from "types/ModalIds";
import { useTranslations } from "use-intl";

export function BusinessSearchEmployeesTab() {
  const t = useTranslations();
  const { currentResult } = useBusinessSearch();
  const tableState = useTableState();
  const { openModal, closeModal } = useModal();

  if (!currentResult) {
    return null;
  }

  function handleOpenInNameSearch(citizen: Pick<BaseCitizen, "name" | "surname" | "id">) {
    closeModal(ModalIds.BusinessSearch);
    openModal(ModalIds.NameSearch, {
      ...citizen,
      name: `${citizen.name} ${citizen.surname}`,
    });
  }

  return (
    <TabsContent value="business-search-employees-tab">
      <header className="flex items-center justify-between mb-3">
        <h3 className="text-xl font-semibold">{t("Business.employees")}</h3>
      </header>

      <Table
        features={{ isWithinCardOrModal: true }}
        columns={[
          { header: t("Common.name"), accessorKey: "name" },
          { header: t("Business.role"), accessorKey: "role" },
          { header: t("Business.employeeOfTheMonth"), accessorKey: "employeeOfTheMonth" },
          { header: t("Common.actions"), accessorKey: "actions" },
        ]}
        data={currentResult.employees.map((employee) => ({
          id: employee.id,
          name: `${employee.citizen.name} ${employee.citizen.surname}`,
          role: employee.role?.value.value,
          employeeOfTheMonth: t(`Common.${yesOrNoText(employee.employeeOfTheMonth)}`),
          actions: (
            <Button
              type="button"
              onPress={() => handleOpenInNameSearch(employee.citizen)}
              size="xs"
            >
              {t("Leo.viewInNameSearch")}
            </Button>
          ),
        }))}
        tableState={tableState}
      />
    </TabsContent>
  );
}
