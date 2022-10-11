import { useTranslations } from "use-intl";
import * as React from "react";
import { getSessionUser } from "lib/auth";
import { getTranslations } from "lib/getTranslation";
import type { GetServerSideProps } from "next";
import { type CustomField, Rank } from "@snailycad/types";
import { AdminLayout } from "components/admin/AdminLayout";
import { requestAll } from "lib/utils";
import { Title } from "components/shared/Title";
import { Permissions } from "@snailycad/permissions";
import { Button } from "@snailycad/ui";
import { useModal } from "state/modalState";
import { Table, useTableState } from "components/shared/Table";
import { ModalIds } from "types/ModalIds";
import { ManageCustomFieldModal } from "components/admin/manage/custom-fields/ManageCustomFieldModal";
import { AlertModal } from "components/modal/AlertModal";
import useFetch from "lib/useFetch";
import { usePermission } from "hooks/usePermission";
import type { DeleteManageCustomFieldsData } from "@snailycad/types/api";
import { useTemporaryItem } from "hooks/shared/useTemporaryItem";

interface Props {
  customFields: CustomField[];
}

export default function ManageCustomFields({ customFields: data }: Props) {
  const [customFields, setCustomFields] = React.useState(data);
  const [tempField, fieldState] = useTemporaryItem(customFields);
  const tableState = useTableState();

  const { state, execute } = useFetch();
  const { hasPermissions } = usePermission();
  const { openModal, closeModal } = useModal();
  const t = useTranslations("Management");
  const common = useTranslations("Common");
  const hasManagePermissions = hasPermissions([Permissions.ManageCustomFields], true);

  async function handleDelete() {
    if (!tempField) return;

    const { json } = await execute<DeleteManageCustomFieldsData>({
      path: `/admin/manage/custom-fields/${tempField.id}`,
      method: "DELETE",
    });

    if (typeof json === "boolean" && json) {
      setCustomFields((p) => p.filter((v) => v.id !== tempField.id));
      fieldState.setTempId(null);
      closeModal(ModalIds.AlertDeleteCustomField);
    }
  }

  function handleEditClick(field: CustomField) {
    fieldState.setTempId(field.id);
    openModal(ModalIds.ManageCustomField);
  }

  function handleDeleteClick(field: CustomField) {
    fieldState.setTempId(field.id);
    openModal(ModalIds.AlertDeleteCustomField);
  }

  React.useEffect(() => {
    setCustomFields(data);
  }, [data]);

  return (
    <AdminLayout
      permissions={{
        fallback: (u) => u.rank !== Rank.USER,
        permissions: [Permissions.ManageCustomFields, Permissions.ViewCustomFields],
      }}
    >
      <header className="flex items-start justify-between mb-5">
        <div className="flex flex-col">
          <Title className="!mb-0">{t("MANAGE_CUSTOM_FIELDS")}</Title>

          <p className="max-w-2xl mt-2 text-neutral-700 dark:text-gray-400">
            Here you can add custom fields, these fields can be added by any officer to citizens
            when searching their information.
          </p>
        </div>

        {hasManagePermissions ? (
          <div>
            <Button onPress={() => openModal(ModalIds.ManageCustomField)}>
              {t("createCustomField")}
            </Button>
          </div>
        ) : null}
      </header>

      {customFields.length <= 0 ? (
        <p>{t("noCustomFields")}</p>
      ) : (
        <Table
          tableState={tableState}
          data={customFields.map((field) => ({
            id: field.id,
            name: field.name,
            category: field.category,
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
            { header: "Category", accessorKey: "category" },
            hasManagePermissions ? { header: common("actions"), accessorKey: "actions" } : null,
          ]}
        />
      )}

      <ManageCustomFieldModal
        onUpdate={(oldField, newField) => {
          setCustomFields((prev) => {
            const idx = prev.indexOf(oldField);
            prev[idx] = newField;
            return prev;
          });
          fieldState.setTempId(null);
        }}
        onCreate={(newField) => setCustomFields((p) => [newField, ...p])}
        onClose={() => fieldState.setTempId(null)}
        field={tempField}
      />
      <AlertModal
        id={ModalIds.AlertDeleteCustomField}
        title={t("deleteCustomField")}
        description={t("alert_deleteCustomField")}
        onDeleteClick={handleDelete}
        onClose={() => fieldState.setTempId(null)}
        state={state}
      />
    </AdminLayout>
  );
}

export const getServerSideProps: GetServerSideProps = async ({ locale, req }) => {
  const user = await getSessionUser(req);
  const [customFields] = await requestAll(req, [["/admin/manage/custom-fields", []]]);

  return {
    props: {
      customFields,
      session: user,
      messages: {
        ...(await getTranslations(["admin", "values", "common"], user?.locale ?? locale)),
      },
    },
  };
};
