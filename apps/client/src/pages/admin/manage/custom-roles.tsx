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
import { Table, useTableState } from "components/shared/Table";
import { ModalIds } from "types/ModalIds";
import { AlertModal } from "components/modal/AlertModal";
import useFetch from "lib/useFetch";
import { usePermission } from "hooks/usePermission";
import { ManageCustomRolesModal } from "components/admin/manage/custom-roles/ManageCustomRolesModal";
import { FullDate } from "components/shared/FullDate";
import type { DeleteCustomRoleByIdData, GetCustomRolesData } from "@snailycad/types/api";

interface Props {
  customRoles: GetCustomRolesData;
}

export default function ManageCustomRoles({ customRoles: data }: Props) {
  const [customRoles, setCustomRoles] = React.useState(data);
  const [tempRole, setTempRole] = React.useState<CustomRole | null>(null);
  const tableState = useTableState();

  const { state, execute } = useFetch();
  const { hasPermissions } = usePermission();
  const { openModal, closeModal } = useModal();
  const t = useTranslations("Management");
  const common = useTranslations("Common");
  const hasManagePermissions = hasPermissions([Permissions.ManageCustomRoles], true);

  async function handleDelete() {
    if (!tempRole) return;

    const { json } = await execute<DeleteCustomRoleByIdData>({
      path: `/admin/manage/custom-roles/${tempRole.id}`,
      method: "DELETE",
    });

    if (typeof json === "boolean" && json) {
      setCustomRoles((p) => p.filter((v) => v.id !== tempRole.id));
      setTempRole(null);
      closeModal(ModalIds.AlertDeleteCustomRole);
    }
  }

  function handleEditClick(field: CustomRole) {
    setTempRole(field);
    openModal(ModalIds.ManageCustomRole);
  }

  function handleDeleteClick(field: CustomRole) {
    setTempRole(field);
    openModal(ModalIds.AlertDeleteCustomRole);
  }

  React.useEffect(() => {
    setCustomRoles(data);
  }, [data]);

  return (
    <AdminLayout
      permissions={{
        fallback: (u) => u.rank !== Rank.USER,
        permissions: [Permissions.ManageCustomRoles, Permissions.ViewCustomRoles],
      }}
    >
      <header className="flex items-start justify-between mb-5">
        <div className="flex flex-col">
          <Title className="!mb-0">{t("MANAGE_CUSTOM_ROLES")}</Title>

          <p className="max-w-2xl mt-2 text-neutral-700 dark:text-gray-400">
            A list of custom roles, these roles can be given to users instead of giving a user
            permissions one by one.
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

      {customRoles.length <= 0 ? (
        <p>{t("noCustomRoles")}</p>
      ) : (
        <Table
          tableState={tableState}
          data={customRoles.map((field) => ({
            id: field.id,
            name: field.name,
            permissions: field.permissions.join(", "),
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
          setCustomRoles((p) => [role, ...p]);
        }}
        onUpdate={(oldRole, newRole) => {
          const copied = [...customRoles];
          const idx = copied.indexOf(oldRole);
          copied[idx] = newRole;

          setCustomRoles(copied);
        }}
        role={tempRole}
        onClose={() => setTempRole(null)}
      />

      <AlertModal
        id={ModalIds.AlertDeleteCustomRole}
        title={t("deleteCustomRole")}
        description={t.rich("alert_deleteCustomRole", {
          span: (children) => <span className="font-semibold">{children}</span>,
          role: tempRole?.name,
        })}
        onDeleteClick={handleDelete}
        onClose={() => setTempRole(null)}
        state={state}
      />
    </AdminLayout>
  );
}

export const getServerSideProps: GetServerSideProps = async ({ locale, req }) => {
  const [customRoles] = await requestAll(req, [["/admin/manage/custom-roles", []]]);

  return {
    props: {
      customRoles,
      session: await getSessionUser(req),
      messages: {
        ...(await getTranslations(["admin", "values", "common"], locale)),
      },
    },
  };
};
