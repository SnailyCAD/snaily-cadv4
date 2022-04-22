import { useTranslations } from "use-intl";
import * as React from "react";
import { getSessionUser } from "lib/auth";
import { getTranslations } from "lib/getTranslation";
import type { GetServerSideProps } from "next";
import { type CustomField, Rank } from "@snailycad/types";
import { AdminLayout } from "components/admin/AdminLayout";
import { requestAll, yesOrNoText } from "lib/utils";
import { Title } from "components/shared/Title";
import { Permissions } from "@snailycad/permissions";
import { Button } from "components/Button";
import { useModal } from "state/modalState";
import { Table } from "components/shared/Table";
import { ModalIds } from "types/ModalIds";
import { ManageCustomFieldModal } from "components/admin/manage/custom-fields/ManageCustomFieldModal";
import { AlertModal } from "components/modal/AlertModal";
import useFetch from "lib/useFetch";
import { usePermission } from "hooks/usePermission";

interface Props {
  customFields: CustomField[];
}

export default function ManageCustomFields({ customFields: data }: Props) {
  const [customFields, setCustomFields] = React.useState(data);
  const [tempField, setTempField] = React.useState<CustomField | null>(null);

  const { state, execute } = useFetch();
  const { hasPermissions } = usePermission();
  const { openModal, closeModal } = useModal();
  const t = useTranslations("Management");
  const common = useTranslations("Common");

  async function handleDelete() {
    if (!tempField) return;

    const { json } = await execute(`/admin/manage/custom-fields/${tempField.id}`, {
      method: "DELETE",
    });

    if (typeof json === "boolean" && json) {
      setCustomFields((p) => p.filter((v) => v.id !== tempField.id));
      setTempField(null);
      closeModal(ModalIds.AlertDeleteCustomField);
    }
  }

  function handleEditClick(field: CustomField) {
    setTempField(field);
    openModal(ModalIds.ManageCustomField);
  }

  function handleDeleteClick(field: CustomField) {
    setTempField(field);
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
      <header className="flex items-center justify-between mb-5">
        <Title className="!mb-0">{t("MANAGE_CUSTOM_FIELDS")}</Title>

        <div>
          <Button onClick={() => openModal(ModalIds.ManageCustomField)}>
            {t("createCustomField")}
          </Button>
        </div>
      </header>

      {customFields.length <= 0 ? (
        <p>{t("noCustomFields")}</p>
      ) : (
        <Table
          data={customFields.map((field) => ({
            name: field.name,
            category: field.category,
            citizenEditable: common(yesOrNoText(field.citizenEditable)),
            actions: (
              <>
                <Button small variant="success" onClick={() => handleEditClick(field)}>
                  {common("edit")}
                </Button>
                <Button
                  className="ml-2"
                  small
                  variant="danger"
                  onClick={() => handleDeleteClick(field)}
                >
                  {common("delete")}
                </Button>
              </>
            ),
          }))}
          columns={[
            { Header: common("name"), accessor: "name" },
            { Header: "Category", accessor: "category" },
            { Header: "Citizen Editable", accessor: "citizenEditable" },
            hasPermissions([Permissions.ViewCustomFields], true)
              ? { Header: common("actions"), accessor: "actions" }
              : null,
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
          setTempField(null);
        }}
        onCreate={(newField) => setCustomFields((p) => [newField, ...p])}
        onClose={() => setTempField(null)}
        field={tempField}
      />
      <AlertModal
        id={ModalIds.AlertDeleteCustomField}
        title={t("deleteCustomField")}
        description={t("alert_deleteCustomField")}
        onDeleteClick={handleDelete}
        onClose={() => setTempField(null)}
        state={state}
      />
    </AdminLayout>
  );
}

export const getServerSideProps: GetServerSideProps = async ({ locale, req }) => {
  const [customFields] = await requestAll(req, [["/admin/manage/custom-fields", []]]);

  return {
    props: {
      customFields,
      session: await getSessionUser(req),
      messages: {
        ...(await getTranslations(["admin", "values", "common"], locale)),
      },
    },
  };
};
