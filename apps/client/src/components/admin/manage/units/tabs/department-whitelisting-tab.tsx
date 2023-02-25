import * as React from "react";
import type { Unit } from "src/pages/admin/manage/units";
import useFetch from "lib/useFetch";
import { formatUnitDivisions, makeUnitName, formatOfficerDepartment } from "lib/utils";
import { useTranslations } from "use-intl";
import { Button, buttonVariants, TabsContent } from "@snailycad/ui";
import { useGenerateCallsign } from "hooks/useGenerateCallsign";
import { Table, useAsyncTable, useTableState } from "components/shared/Table";
import { useModal } from "state/modalState";
import { ModalIds } from "types/ModalIds";
import { AlertDeclineOfficerModal } from "../AlertDeclineOfficerModal";
import Link from "next/link";
import type {
  GetManageUnitsData,
  PostManageUnitAcceptDeclineDepartmentData,
} from "@snailycad/types/api";
import { useFeatureEnabled } from "hooks/useFeatureEnabled";
import { Permissions, usePermission } from "hooks/usePermission";
import { SearchArea } from "components/shared/search/search-area";
import { WhitelistStatus } from "@snailycad/types";

interface Props {
  pendingUnits: GetManageUnitsData;
}

export function DepartmentWhitelistingTab({ pendingUnits }: Props) {
  const [search, setSearch] = React.useState("");

  const asyncTable = useAsyncTable({
    search,
    totalCount: pendingUnits.totalCount,
    initialData: pendingUnits.units,
    fetchOptions: {
      path: "/admin/manage/units?pendingOnly=true",
      onResponse: (data: GetManageUnitsData) => ({
        data: data.units,
        totalCount: data.totalCount,
      }),
    },
  });

  const { hasPermissions } = usePermission();
  const { openModal, closeModal } = useModal();
  const t = useTranslations();
  const common = useTranslations("Common");
  const { generateCallsign } = useGenerateCallsign();
  const { state, execute } = useFetch();
  const tableState = useTableState();
  const { DIVISIONS } = useFeatureEnabled();
  const hasViewUsersPermissions = hasPermissions([Permissions.ViewUsers], true);

  async function handleAcceptOrDecline(data: {
    unit: Unit;
    type: "ACCEPT" | "DECLINE";
    action?: string;
    helpers?: any;
  }) {
    const { helpers, unit, ...rest } = data;

    const { json } = await execute<PostManageUnitAcceptDeclineDepartmentData>({
      path: `/admin/manage/units/departments/${unit.id}`,
      data: rest,
      helpers,
      method: "POST",
    });

    if (json?.id) {
      closeModal(ModalIds.AlertDeclineOfficer);

      if (json.deleted) {
        asyncTable.remove(unit.id);
      } else {
        asyncTable.update(unit.id, { ...unit, ...json });
      }
    }
  }

  return (
    <TabsContent value="departmentWhitelisting">
      <SearchArea
        search={{ search, setSearch }}
        asyncTable={asyncTable}
        totalCount={pendingUnits.totalCount}
      />

      {asyncTable.items.length <= 0 ? (
        <p className="mt-2">{t("Management.noPendingOfficers")}</p>
      ) : (
        <Table
          tableState={tableState}
          data={asyncTable.items.map((officer) => {
            const isPending = officer.whitelistStatus?.status === WhitelistStatus.PENDING;
            return {
              rowProps: { className: !isPending ? "opacity-50" : undefined },
              id: officer.id,
              name: makeUnitName(officer),
              callsign: generateCallsign(officer),
              badgeNumber: officer.badgeNumber,
              department: formatOfficerDepartment(officer) ?? common("none"),
              division: formatUnitDivisions(officer),
              user:
                hasViewUsersPermissions && officer.user ? (
                  <Link
                    href={`/admin/manage/users/${officer.userId}`}
                    className={`rounded-md transition-all p-1 px-1.5 ${buttonVariants.default}`}
                  >
                    {officer.user.username}
                  </Link>
                ) : (
                  officer.user?.username ?? common("Leo.temporaryUnit")
                ),
              actions: (
                <>
                  <Button
                    disabled={!isPending || state === "loading"}
                    onPress={() => handleAcceptOrDecline({ unit: officer, type: "ACCEPT" })}
                    size="xs"
                    variant="success"
                  >
                    {common("accept")}
                  </Button>

                  <Button
                    onPress={() => openModal(ModalIds.AlertDeclineOfficer, officer)}
                    disabled={!isPending || state === "loading"}
                    className="ml-2"
                    size="xs"
                    variant="danger"
                  >
                    {common("decline")}
                  </Button>
                </>
              ),
            };
          })}
          columns={[
            { header: common("name"), accessorKey: "name" },
            { header: t("Leo.callsign"), accessorKey: "callsign" },
            { header: t("Leo.badgeNumber"), accessorKey: "badgeNumber" },
            { header: t("Leo.department"), accessorKey: "department" },
            DIVISIONS ? { header: t("Leo.division"), accessorKey: "division" } : null,
            { header: common("user"), accessorKey: "user" },
            { header: common("actions"), accessorKey: "actions" },
          ]}
        />
      )}

      <AlertDeclineOfficerModal
        onSubmit={(data) => handleAcceptOrDecline({ ...data, type: "DECLINE" })}
        state={state}
      />
    </TabsContent>
  );
}
