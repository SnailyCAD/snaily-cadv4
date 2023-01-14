import * as React from "react";
import { useTranslations } from "use-intl";
import { getSessionUser } from "lib/auth";
import { getTranslations } from "lib/getTranslation";
import type { GetServerSideProps } from "next";
import { Rank } from "@snailycad/types";
import { AdminLayout } from "components/admin/AdminLayout";
import { requestAll } from "lib/utils";
import { Title } from "components/shared/Title";
import { Permissions } from "hooks/usePermission";
import type { GetAuditLogsData } from "@snailycad/types/api";
import { useModal } from "state/modalState";
import { Table, useAsyncTable, useTableState } from "components/shared/Table";
import { SearchArea } from "components/shared/search/search-area";
import { FullDate } from "components/shared/FullDate";
import { Button } from "@snailycad/ui";
import { ModalIds } from "types/ModalIds";
import { compareDifferences } from "@snailycad/audit-logger/client";
import { ArrowRight } from "react-bootstrap-icons";
import { CallDescription } from "components/dispatch/active-calls/CallDescription";
import { ViewAuditLogDataModal } from "components/admin/manage/audit-logs/view-audit-logs-diff-modal";

interface Props {
  data: GetAuditLogsData;
}

export default function ManageAuditLogs({ data }: Props) {
  const [search, setSearch] = React.useState("");

  const common = useTranslations("Common");
  const t = useTranslations("Management");
  const { openModal } = useModal();

  const asyncTable = useAsyncTable({
    search,
    fetchOptions: {
      path: "/admin/manage/cad-settings/audit-logs",
      onResponse: (data: GetAuditLogsData) => ({
        data: data.logs,
        totalCount: data.totalCount,
      }),
    },
    totalCount: data.totalCount,
    initialData: data.logs,
  });

  const tableState = useTableState({ pagination: asyncTable.pagination });

  return (
    <AdminLayout
      permissions={{
        fallback: (u) => u.rank !== Rank.USER,
        permissions: [
          // todo: permissions
          Permissions.BanUsers,
          Permissions.ViewUsers,
          Permissions.ManageUsers,
          Permissions.DeleteUsers,
        ],
      }}
    >
      <Title>{t("MANAGE_AUDIT_LOGS")}</Title>

      <SearchArea
        totalCount={data.totalCount}
        asyncTable={asyncTable}
        search={{ search, setSearch }}
      />

      <Table
        tableState={tableState}
        data={asyncTable.items.map((auditLog) => {
          const differences = compareDifferences(auditLog.action);

          return {
            id: auditLog.id,
            type: auditLog.action.type,
            executor: auditLog.executor.username,
            createdAt: <FullDate>{auditLog.createdAt}</FullDate>,
            // changes: auditLog.translationKey
            //   ? t.rich(auditLog.translationKey, {
            //       span: (children) => <span className="font-semibold">{children}</span>,
            //       value:
            //         auditLog.action.new && "id" in auditLog.action.new && auditLog.action.new.id
            //           ? auditLog.action.new.id
            //           : "UNKNOWN",
            //     })
            //   : differences?.map((difference) => (
            //       <p className="flex items-center gap-2" key={difference.key}>
            //         <span>{difference.key}: </span>
            //         <span>{difference.previous}</span>
            //         <ArrowRight />
            //         <span>{difference.new}</span>
            //       </p>
            //     )),
            data: (
              <Button onPress={() => openModal(ModalIds.ViewAuditLogData, auditLog)} size="xs">
                {t("data")}
              </Button>
            ),
          };
        })}
        columns={[
          { header: common("type"), accessorKey: "type" },
          { header: common("user"), accessorKey: "executor" },
          { header: t("changes"), accessorKey: "changes" },
          { header: t("data"), accessorKey: "data" },
          { header: common("createdAt"), accessorKey: "createdAt" },
        ]}
      />

      <ViewAuditLogDataModal />
    </AdminLayout>
  );
}

export const getServerSideProps: GetServerSideProps = async ({ locale, req }) => {
  const [data] = await requestAll(req, [
    ["/admin/manage/cad-settings/audit-logs", { logs: [], totalCount: 0 }],
  ]);
  const user = await getSessionUser(req);

  return {
    props: {
      data,
      session: user,
      messages: {
        ...(await getTranslations(
          ["citizen", "admin", "values", "common"],
          user?.locale ?? locale,
        )),
      },
    },
  };
};
