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
import { Button } from "components/Button";
import { useModal } from "context/ModalContext";
import { Table } from "components/shared/Table";
import { ModalIds } from "types/ModalIds";
import { ManageCustomFieldModal } from "components/admin/manage/custom-fields/ManageCustomFieldModal";

interface Props {
  customFields: CustomField[];
}

export default function ManageCustomFields({ customFields: data }: Props) {
  const [customFields, setCustomFields] = React.useState(data);
  const [tempField, setTempField] = React.useState<CustomField | null>(null);

  const { openModal } = useModal();
  const t = useTranslations("Management");
  const common = useTranslations("Common");

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
        permissions: [Permissions.ManageCustomFields],
      }}
    >
      <Title>{t("MANAGE_CUSTOM_FIELDS")}</Title>

      <header className="flex items-center justify-between">
        <h1 className="text-3xl font-semibold mb-3">{t("MANAGE_CUSTOM_FIELDS")}</h1>

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
            { Header: "category", accessor: "category" },
            { Header: common("actions"), accessor: "actions" },
          ]}
        />
      )}

      <ManageCustomFieldModal field={tempField} />
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
