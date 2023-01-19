import * as React from "react";
import { useTranslations } from "use-intl";
import { getSessionUser } from "lib/auth";
import { getTranslations } from "lib/getTranslation";
import type { GetServerSideProps } from "next";
import { Rank } from "@snailycad/types";
import { AdminLayout } from "components/admin/AdminLayout";
import { requestAll } from "lib/utils";
import { Title } from "components/shared/Title";
import type { GetAuditLogsData } from "@snailycad/types/api";
import { useModal } from "state/modalState";
import { Table, useAsyncTable, useTableState } from "components/shared/Table";
import { SearchArea } from "components/shared/search/search-area";
import { FullDate } from "components/shared/FullDate";
import { Button } from "@snailycad/ui";
import { ModalIds } from "types/ModalIds";
import dynamic from "next/dynamic";
import { FormField } from "components/form/FormField";
import { Select } from "components/form/Select";
import { AuditLogActionType } from "@snailycad/audit-logger";
import { defaultPermissions } from "@snailycad/permissions";

const ViewAuditLogsDiffModal = dynamic(
  async () =>
    (await import("components/admin/manage/audit-logs/view-audit-logs-diff-modal"))
      .ViewAuditLogsDiffModal,
  { ssr: false },
);

interface Props {
  data: GetAuditLogsData;
}

const ActionTypes = Object.keys(AuditLogActionType);

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
        permissions: defaultPermissions.allDefaultAdminPermissions,
      }}
    >
      <Title>{t("MANAGE_AUDIT_LOGS")}</Title>

      <SearchArea
        totalCount={data.totalCount}
        asyncTable={asyncTable}
        search={{ search, setSearch }}
      >
        <FormField className="w-full max-w-[15rem]" label={common("type")}>
          <Select
            isClearable
            value={asyncTable.filters?.type ?? null}
            onChange={(event) =>
              asyncTable.setFilters((prev) => ({ ...prev, type: event.target.value }))
            }
            values={ActionTypes.map((type) => ({
              label: type,
              value: type,
            }))}
          />
        </FormField>
      </SearchArea>

      <Table
        tableState={tableState}
        data={asyncTable.items.map((auditLog) => {
          return {
            id: auditLog.id,
            type: auditLog.action.type,
            executor: auditLog.executor?.username ?? "Public API",
            createdAt: <FullDate>{auditLog.createdAt}</FullDate>,
            actions: (
              <Button onPress={() => openModal(ModalIds.ViewAuditLogData, auditLog)} size="xs">
                {t("viewDiff")}
              </Button>
            ),
          };
        })}
        columns={[
          { header: common("type"), accessorKey: "type" },
          { header: t("executor"), accessorKey: "executor" },
          { header: common("createdAt"), accessorKey: "createdAt" },
          { header: common("actions"), accessorKey: "actions" },
        ]}
      />

      <ViewAuditLogsDiffModal />
    </AdminLayout>
  );
}

export const getServerSideProps: GetServerSideProps = async ({ locale, res, req }) => {
  const [data] = await requestAll(req, [
    ["/admin/manage/cad-settings/audit-logs", { logs: [], totalCount: 0 }],
  ]);
  const user = await getSessionUser(req);

  // https://nextjs.org/docs/going-to-production#caching
  res.setHeader("Cache-Control", "public, s-maxage=10, stale-while-revalidate=59");

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
