import { useTranslations } from "use-intl";
import * as React from "react";
import { getSessionUser } from "lib/auth";
import { getTranslations } from "lib/getTranslation";
import type { GetServerSideProps } from "next";
import { Rank } from "@snailycad/types";
import { AdminLayout } from "components/admin/AdminLayout";
import { requestAll } from "lib/utils";
import { Table } from "components/shared/Table";
import { Title } from "components/shared/Title";
import { useAsyncTable } from "hooks/shared/table/useAsyncTable";
import { defaultPermissions } from "@snailycad/permissions";
import { FullDate } from "components/shared/FullDate";

interface Props {
  data: { auditLogs: AuditLog[]; totalCount: number };
}

export default function ManageBusinesses({ data }: Props) {
  const asyncTable = useAsyncTable({
    fetchOptions: {
      path: "/admin/audit-logs",
      onResponse: (json) => ({ data: json.auditLogs, totalCount: json.totalCount }),
    },
    initialData: data.auditLogs,
    totalCount: data.totalCount,
  });

  const t = useTranslations("Management");
  const common = useTranslations("Common");

  return (
    <AdminLayout
      permissions={{
        fallback: (u) => u.rank !== Rank.USER,
        permissions: defaultPermissions.allDefaultAdminPermissions,
      }}
    >
      <Title>{t("MANAGE_AUDIT_LOGS")}</Title>

      {data.auditLogs.length <= 0 ? (
        <p className="mt-5">{t("noAuditLogs")}</p>
      ) : (
        <Table
          pagination={{
            enabled: true,
            totalCount: asyncTable.pagination.totalCount,
            fetchData: asyncTable.pagination,
          }}
          data={asyncTable.data.map((auditLog) => ({
            type: auditLog.action.type,
            createdAt: <FullDate>{auditLog.createdAt}</FullDate>,
          }))}
          columns={[
            { Header: common("type"), accessor: "type" },
            { Header: common("createdAt"), accessor: "createdAt" },
          ]}
        />
      )}
    </AdminLayout>
  );
}

export const getServerSideProps: GetServerSideProps = async ({ locale, req }) => {
  const user = await getSessionUser(req);
  const [data] = await requestAll(req, [["/admin/audit-logs", []]]);

  return {
    props: {
      data,
      session: user,
      messages: {
        ...(await getTranslations(["admin", "values", "common"], user?.locale ?? locale)),
      },
    },
  };
};
