import { useTranslations } from "use-intl";
import { Button, TabsContent } from "@snailycad/ui";
import { useBusinessState } from "state/business-state";
import { useModal } from "state/modalState";
import { ModalIds } from "types/ModalIds";
import type { EmployeeValue } from "@snailycad/types";
import { AlertModal } from "components/modal/AlertModal";
import useFetch from "lib/useFetch";
import { Table, useAsyncTable, useTableState } from "components/shared/Table";
import type {
  DeleteBusinessFireEmployeeData,
  GetBusinessRolesByBusinessIdData,
} from "@snailycad/types/api";
import { useTemporaryItem } from "hooks/shared/useTemporaryItem";
import { shallow } from "zustand/shallow";
import { getValueStrFromValue } from "lib/admin/values/utils";
import { ManageBusinessRoleModal } from "./manage-business-role-modal";

const initialData = {
  data: [],
  totalCount: 0,
};

export function BusinessRolesTab() {
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

  const returnNull = !currentBusiness || !currentEmployee;

  const asyncTable = useAsyncTable<GetBusinessRolesByBusinessIdData["roles"][number]>({
    initialData: currentBusiness?.roles ?? initialData.data,
    totalCount: currentBusiness?.roles.length ?? initialData.totalCount,
    disabled: returnNull,
    fetchOptions: {
      path: `/businesses/roles/${currentBusiness?.id}?employeeId=${currentEmployee?.id}`,
      onResponse: (json: GetBusinessRolesByBusinessIdData) => ({
        data: json.roles,
        totalCount: json.totalCount,
      }),
    },
  });

  const [tempRole, roleState] = useTemporaryItem(asyncTable.items);
  const tableState = useTableState();

  async function handleDeleteRole() {
    if (!tempRole || !currentBusiness || !currentEmployee) return;

    const { json } = await execute<DeleteBusinessFireEmployeeData>({
      path: `/businesses/roles/${currentBusiness.id}/${tempRole.id}?employeeId=${currentEmployee.id}`,
      method: "DELETE",
    });

    if (json) {
      asyncTable.remove(tempRole.id);

      if (currentBusiness) {
        setCurrentBusiness({
          ...currentBusiness,
          roles: currentBusiness.roles.filter((role) => role.id !== tempRole.id),
        });
      }

      roleState.setTempId(null);
      closeModal(ModalIds.AlertDeleteBusinessRole);
    }
  }

  function handleManageClick(employee: EmployeeValue) {
    roleState.setTempId(employee.id);
    openModal(ModalIds.ManageBusinessRole);
  }

  function handleDeleteClick(employee: EmployeeValue) {
    roleState.setTempId(employee.id);
    openModal(ModalIds.AlertDeleteBusinessRole);
  }

  if (returnNull) {
    return null;
  }

  return (
    <TabsContent aria-label={t("businessRoles")} value="businessRoles">
      <header className="flex items-center justify-between">
        <h3 className="text-2xl font-semibold">{t("businessRoles")}</h3>

        <Button onPress={() => openModal(ModalIds.ManageBusinessRole)}>
          {t("addBusinessRole")}
        </Button>
      </header>

      <Table
        tableState={tableState}
        data={asyncTable.items.map((businessRole) => ({
          id: businessRole.id,
          value: getValueStrFromValue(businessRole),
          as: businessRole.as,
          actions: (
            <>
              <Button size="xs" onPress={() => handleManageClick(businessRole)} variant="success">
                {common("manage")}
              </Button>
              <Button
                size="xs"
                onPress={() => handleDeleteClick(businessRole)}
                className="ml-2"
                variant="danger"
              >
                {common("delete")}
              </Button>
            </>
          ),
        }))}
        columns={[
          { header: common("name"), accessorKey: "value" },
          { header: t("as"), accessorKey: "as" },
          { header: common("actions"), accessorKey: "actions" },
        ]}
      />

      <AlertModal
        id={ModalIds.AlertDeleteBusinessRole}
        title={t("deleteBusinessRole")}
        description={t.rich("alert_deleteBusinessRole", {
          role: tempRole?.value.value,
        })}
        onDeleteClick={handleDeleteRole}
        state={state}
        onClose={() => roleState.setTempId(null)}
      />

      <ManageBusinessRoleModal
        onUpdate={(oldRole, newRole) => {
          if (currentBusiness) {
            setCurrentBusiness({
              ...currentBusiness,
              roles: currentBusiness.roles.map((role) => {
                if (role.id === oldRole.id) {
                  return newRole;
                }

                return role;
              }),
            });
          }
        }}
        onClose={() => roleState.setTempId(null)}
        onCreate={(value) => {
          asyncTable.prepend(value);

          if (currentBusiness) {
            setCurrentBusiness({
              ...currentBusiness,
              roles: [...currentBusiness.roles, value],
            });
          }
        }}
        value={tempRole}
      />
    </TabsContent>
  );
}
