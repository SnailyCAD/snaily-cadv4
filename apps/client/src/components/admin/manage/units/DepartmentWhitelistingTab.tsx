import * as React from "react";
import type { Unit } from "src/pages/admin/manage/units";
import useFetch from "lib/useFetch";
import { formatUnitDivisions, makeUnitName, formatOfficerDepartment } from "lib/utils";
import { useTranslations } from "use-intl";
import { Button, buttonVariants } from "@snailycad/ui";
import { useGenerateCallsign } from "hooks/useGenerateCallsign";
import { Table, useTableState } from "components/shared/Table";
import { TabsContent } from "components/shared/TabList";
import { useModal } from "state/modalState";
import { ModalIds } from "types/ModalIds";
import { AlertDeclineOfficerModal } from "./AlertDeclineOfficerModal";
import { useRouter } from "next/router";
import Link from "next/link";
import type { PostManageUnitAcceptDeclineDepartmentData } from "@snailycad/types/api";
import { useFeatureEnabled } from "hooks/useFeatureEnabled";
import { Permissions, usePermission } from "hooks/usePermission";

interface Props {
  pendingOfficers: Unit[];
  search: string;
}

export function DepartmentWhitelistingTab({ search, pendingOfficers }: Props) {
  const router = useRouter();

  const { hasPermissions } = usePermission();
  const { openModal, closeModal } = useModal();
  const t = useTranslations();
  const common = useTranslations("Common");
  const { generateCallsign } = useGenerateCallsign();
  const { state, execute } = useFetch();
  const tableState = useTableState({ search: { value: search } });
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
      router.replace({ pathname: router.pathname, query: router.query });
    }
  }

  return (
    <TabsContent value="departmentWhitelisting">
      {pendingOfficers.length <= 0 ? (
        <p>{t("Management.noPendingOfficers")}</p>
      ) : (
        <Table
          tableState={tableState}
          data={pendingOfficers.map((officer) => ({
            id: officer.id,
            name: makeUnitName(officer),
            callsign: generateCallsign(officer),
            badgeNumber: officer.badgeNumber,
            department: formatOfficerDepartment(officer) ?? common("none"),
            division: formatUnitDivisions(officer),
            user: hasViewUsersPermissions ? (
              <Link href={`/admin/manage/users/${officer.userId}`}>
                <a
                  href={`/admin/manage/users/${officer.userId}`}
                  className={`rounded-md transition-all p-1 px-1.5 ${buttonVariants.default}`}
                >
                  {officer.user.username}
                </a>
              </Link>
            ) : (
              officer.user.username
            ),
            actions: (
              <>
                <Button
                  disabled={state === "loading"}
                  onPress={() => handleAcceptOrDecline({ unit: officer, type: "ACCEPT" })}
                  size="xs"
                  variant="success"
                >
                  {common("accept")}
                </Button>

                <Button
                  onPress={() => openModal(ModalIds.AlertDeclineOfficer, officer)}
                  disabled={state === "loading"}
                  className="ml-2"
                  size="xs"
                  variant="danger"
                >
                  {common("decline")}
                </Button>
              </>
            ),
          }))}
          columns={[
            { header: common("name"), accessorKey: "name" },
            { header: t("Leo.callsign"), accessorKey: "callsign" },
            { header: t("Leo.badgeNumber"), accessorKey: "badgeNumber" },
            { header: t("Leo.department"), accessorKey: "department" },
            DIVISIONS ? { header: t("LEO.division"), accessorKey: "division" } : null,
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
