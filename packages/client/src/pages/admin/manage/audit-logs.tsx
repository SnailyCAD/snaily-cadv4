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
import { compareDifferences } from "@snailycad/audit-logger/client";
import { AuditLog, AuditLogActionType } from "@snailycad/audit-logger";
import { ArrowRight } from "react-bootstrap-icons";
import { Button } from "components/Button";
import { ModalIds } from "types/ModalIds";
import { useModal } from "state/modalState";
import { ViewAuditLogDataModal } from "components/admin/manage/audit-logs/ViewAuditLogDataModal";
import type { GetAuditLogs } from "@snailycad/types/api";
import { FormField } from "components/form/FormField";
import { Select } from "components/form/Select";

interface Props {
  data: { auditLogs: AuditLog[]; totalCount: number };
}

export default function ManageBusinesses({ data }: Props) {
  const asyncTable = useAsyncTable({
    fetchOptions: {
      path: "/admin/audit-logs",
      onResponse: (json: GetAuditLogs) => ({ data: json.auditLogs, totalCount: json.totalCount }),
    },
    initialData: data.auditLogs,
    totalCount: data.totalCount,
  });

  const t = useTranslations("AuditLogs");
  const common = useTranslations("Common");
  const { openModal } = useModal();

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
        <>
          <div className="flex items-center gap-2">
            <FormField className="w-60" label="Type">
              <Select
                isClearable
                value={asyncTable.search.search}
                onChange={(e) => asyncTable.search.setSearch(e.target.value)}
                values={Object.values(AuditLogActionType).map((v) => ({ label: v, value: v }))}
              />
            </FormField>
          </div>

          <Table
            pagination={{
              enabled: true,
              totalCount: asyncTable.pagination.totalCount,
              fetchData: asyncTable.pagination,
            }}
            data={asyncTable.data.map((auditLog) => {
              const differences = compareDifferences(auditLog.action);
              return {
                type: auditLog.action.type,
                executor: auditLog.executor.username,
                changes: auditLog.translationKey
                  ? t.rich(auditLog.translationKey, {
                      span: (children) => <span className="font-semibold">{children}</span>,
                      value:
                        auditLog.action.new && "id" in auditLog.action.new && auditLog.action.new.id
                          ? auditLog.action.new.id
                          : "UNKNOWN",
                    })
                  : differences?.map((difference) => (
                      <p className="flex items-center gap-2" key={difference.key}>
                        <span>{difference.key}: </span>
                        <span>{difference.previous}</span>
                        <ArrowRight />
                        <span>{difference.new}</span>
                      </p>
                    )),
                data: (
                  <Button onClick={() => openModal(ModalIds.ViewAuditLogData, auditLog)} size="sm">
                    View full data
                  </Button>
                ),
                createdAt: <FullDate>{auditLog.createdAt}</FullDate>,
              };
            })}
            columns={[
              { Header: common("type"), accessor: "type" },
              { Header: common("user"), accessor: "executor" },
              { Header: t("changes"), accessor: "changes" },
              { Header: t("data"), accessor: "data" },
              { Header: common("createdAt"), accessor: "createdAt" },
            ]}
          />
        </>
      )}

      <ViewAuditLogDataModal />
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
