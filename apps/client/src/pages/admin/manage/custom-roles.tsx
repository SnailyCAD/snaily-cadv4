import { useTranslations } from "use-intl";
import * as React from "react";
import { getSessionUser } from "lib/auth";
import { getTranslations } from "lib/getTranslation";
import type { GetServerSideProps } from "next";
import { type CustomRole, Rank } from "@snailycad/types";
import { AdminLayout } from "components/admin/AdminLayout";
import { requestAll } from "lib/utils";
import { Title } from "components/shared/Title";
import { Permissions } from "@snailycad/permissions";
import { Button } from "@snailycad/ui";
import { useModal } from "state/modalState";
import { Table, useAsyncTable, useTableState } from "components/shared/Table";
import { ModalIds } from "types/ModalIds";
import { AlertModal } from "components/modal/AlertModal";
import useFetch from "lib/useFetch";
import { usePermission } from "hooks/usePermission";
import { FullDate } from "components/shared/FullDate";
import type { DeleteCustomRoleByIdData, GetCustomRolesData } from "@snailycad/types/api";
import dynamic from "next/dynamic";
import { CallDescription } from "components/dispatch/active-calls/CallDescription";
import { useTemporaryItem } from "hooks/shared/useTemporaryItem";
import { SearchArea } from "components/shared/search/search-area";

const ManageCustomRolesModal = dynamic(
  async () =>
    (await import("components/admin/manage/custom-roles/manage-custom-roles-modal"))
      .ManageCustomRolesModal,
  { ssr: false },
);

interface Props {
  customRoles: GetCustomRolesData;
}

export default function ManageCustomRoles({ customRoles: data }: Props) {
  const { state, execute } = useFetch();
  const { hasPermissions } = usePermission();
  const { openModal, closeModal } = useModal();
  const t = useTranslations("Management");
  const common = useTranslations("Common");
  const hasManagePermissions = hasPermissions([Permissions.ManageCustomRoles], true);

  const [search, setSearch] = React.useState("");

  const asyncTable = useAsyncTable({
    fetchOptions: {
      onResponse: (data: GetCustomRolesData) => ({
        data: data.customRoles,
        totalCount: data.totalCount,
      }),
      path: "/admin/manage/custom-roles",
    },
    search,
    totalCount: data.totalCount,
    initialData: data.customRoles,
  });
  const [tempRole, tempRoleState] = useTemporaryItem(asyncTable.items);
  const tableState = useTableState({
    pagination: asyncTable.pagination,
  });

  async function handleDelete() {
    if (!tempRole) return;

    const { json } = await execute<DeleteCustomRoleByIdData>({
      path: `/admin/manage/custom-roles/${tempRole.id}`,
      method: "DELETE",
    });

    if (typeof json === "boolean" && json) {
      asyncTable.remove(tempRole.id);
      tempRoleState.setTempId(null);
      closeModal(ModalIds.AlertDeleteCustomRole);
    }
  }

  function handleEditClick(field: CustomRole) {
    tempRoleState.setTempId(field.id);
    openModal(ModalIds.ManageCustomRole);
  }

  function handleDeleteClick(field: CustomRole) {
    tempRoleState.setTempId(field.id);
    openModal(ModalIds.AlertDeleteCustomRole);
  }

  return (
    <AdminLayout
      permissions={{
        fallback: (u) => u.rank !== Rank.USER,
        permissions: [Permissions.ManageCustomRoles, Permissions.ViewCustomRoles],
      }}
    >
      <header className="flex items-start justify-between mb-3">
        <div className="flex flex-col">
          <Title className="!mb-0">{t("MANAGE_CUSTOM_ROLES")}</Title>

          <p className="max-w-2xl mt-2 text-neutral-700 dark:text-gray-400">
            {t("manageCustomRolesDescription")}
          </p>
        </div>

        <div>
          {hasManagePermissions ? (
            <Button onPress={() => openModal(ModalIds.ManageCustomRole)}>
              {t("createCustomRole")}
            </Button>
          ) : null}
        </div>
      </header>

      <SearchArea
        asyncTable={asyncTable}
        search={{ search, setSearch }}
        totalCount={data.totalCount}
      />

      {asyncTable.items.length <= 0 ? (
        <p className="text-neutral-700 dark:text-gray-400 mt-3">{t("noCustomRoles")}</p>
      ) : (
        <Table
          tableState={tableState}
          data={asyncTable.items.map((field) => ({
            id: field.id,
            name: field.name,
            permissions: (
              <CallDescription nonCard data={{ description: field.permissions.join(", ") }} />
            ),
            discordRole: field.discordRole?.name ?? common("none"),
            createdAt: <FullDate>{field.createdAt}</FullDate>,
            actions: (
              <>
                <Button size="xs" variant="success" onPress={() => handleEditClick(field)}>
                  {common("edit")}
                </Button>
                <Button
                  className="ml-2"
                  size="xs"
                  variant="danger"
                  onPress={() => handleDeleteClick(field)}
                >
                  {common("delete")}
                </Button>
              </>
            ),
          }))}
          columns={[
            { header: common("name"), accessorKey: "name" },
            { header: "Permissions", accessorKey: "permissions" },
            { header: "Discord Role", accessorKey: "discordRole" },
            { header: common("createdAt"), accessorKey: "createdAt" },
            hasManagePermissions ? { header: common("actions"), accessorKey: "actions" } : null,
          ]}
        />
      )}

      <ManageCustomRolesModal
        onCreate={(role) => {
          asyncTable.prepend(role);
        }}
        onUpdate={(newRole) => {
          asyncTable.update(newRole.id, newRole);
        }}
        role={tempRole}
        onClose={() => tempRoleState.setTempId(null)}
      />

      <AlertModal
        id={ModalIds.AlertDeleteCustomRole}
        title={t("deleteCustomRole")}
        description={t.rich("alert_deleteCustomRole", {
          role: tempRole?.name,
        })}
        onDeleteClick={handleDelete}
        onClose={() => tempRoleState.setTempId(null)}
        state={state}
      />
    </AdminLayout>
  );
}

export const getServerSideProps: GetServerSideProps = async ({ locale, req }) => {
  const user = await getSessionUser(req);
  const [customRoles] = await requestAll(req, [
    ["/admin/manage/custom-roles", { totalCount: 0, customRoles: [] }],
  ]);

  return {
    props: {
      customRoles,
      session: user,
      messages: {
        ...(await getTranslations(["admin", "values", "common"], user?.locale ?? locale)),
      },
    },
  };
};
