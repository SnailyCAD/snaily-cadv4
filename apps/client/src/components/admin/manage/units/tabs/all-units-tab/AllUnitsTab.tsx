import * as React from "react";
import type { Unit } from "src/pages/admin/manage/units";
import Link from "next/link";
import {
  formatUnitDivisions,
  makeUnitName,
  yesOrNoText,
  formatOfficerDepartment,
  isEmpty,
} from "lib/utils";
import { useTranslations } from "use-intl";
import { Button, buttonVariants } from "@snailycad/ui";
import { useGenerateCallsign } from "hooks/useGenerateCallsign";
import useFetch from "lib/useFetch";
import { useRouter } from "next/router";
import { Table, useTableState } from "components/shared/Table";
import { TabsContent } from "components/shared/TabList";
import { Status } from "components/shared/Status";
import { usePermission, Permissions } from "hooks/usePermission";
import { useFeatureEnabled } from "hooks/useFeatureEnabled";
import { classNames } from "lib/classNames";
import { useModal } from "state/modalState";
import { ModalIds } from "types/ModalIds";
import { AlertModal } from "components/modal/AlertModal";
import { OfficerRank } from "components/leo/OfficerRank";
import type {
  DeleteManageUnitByIdData,
  GetManageUnitsData,
  PutManageUnitsOffDutyData,
} from "@snailycad/types/api";
import { useTemporaryItem } from "hooks/shared/useTemporaryItem";
import { getSelectedTableRows } from "hooks/shared/table/useTableState";

interface Props {
  units: GetManageUnitsData;
  search: string;
}

export function AllUnitsTab({ search, units }: Props) {
  const [tempUnit, unitState] = useTemporaryItem(units);

  const tableState = useTableState({ search: { value: search } });

  const { hasPermissions } = usePermission();
  const hasManagePermissions = hasPermissions([Permissions.ManageUnits], true);
  const hasDeletePermissions = hasPermissions([Permissions.DeleteUnits], true);
  const hasViewUsersPermissions = hasPermissions([Permissions.ViewUsers], true);
  const { state, execute } = useFetch();

  const t = useTranslations();
  const common = useTranslations("Common");
  const { generateCallsign } = useGenerateCallsign();
  const router = useRouter();
  const { DIVISIONS, BADGE_NUMBERS } = useFeatureEnabled();
  const { openModal, closeModal } = useModal();

  function handleDeleteClick(unit: Unit) {
    unitState.setTempId(unit.id);
    openModal(ModalIds.AlertDeleteUnit);
  }

  async function handleDeleteUnit() {
    if (!tempUnit) return;

    const { json } = await execute<DeleteManageUnitByIdData>({
      path: `/admin/manage/units/${tempUnit.id}`,
      method: "DELETE",
    });

    if (json) {
      unitState.setTempId(null);
      closeModal(ModalIds.AlertDeleteUnit);

      router.replace({
        pathname: router.pathname,
        query: router.query,
      });
    }
  }

  async function setSelectedUnitsOffDuty() {
    const selectedRows = getSelectedTableRows(
      units,
      tableState.rowSelection,
      (unit) => `${unit.id}-${unit.type}`,
    );

    if (selectedRows.length <= 0) return;

    const { json } = await execute<PutManageUnitsOffDutyData>({
      path: "/admin/manage/units/off-duty",
      method: "PUT",
      data: { ids: selectedRows },
    });

    if (Array.isArray(json)) {
      tableState.setRowSelection({});
      router.replace({
        pathname: router.pathname,
        query: router.query,
      });
    }
  }

  const LABELS = {
    DEPUTY: t("Ems.deputy"),
    OFFICER: t("Leo.officer"),
  };

  return (
    <TabsContent value="allUnits">
      {hasManagePermissions && units.length >= 1 ? (
        <Button
          disabled={isEmpty(tableState.rowSelection)}
          onPress={setSelectedUnitsOffDuty}
          className="mt-3"
        >
          {t("Management.setSelectedOffDuty")}
        </Button>
      ) : null}

      {units.length <= 0 ? (
        <p>{t("Management.noUnits")}</p>
      ) : (
        <Table
          tableState={tableState}
          features={{ rowSelection: hasManagePermissions }}
          data={units.map((unit) => {
            const departmentStatus = unit.whitelistStatus?.status;
            const departmentStatusFormatted = departmentStatus
              ? departmentStatus.toLowerCase()
              : "—";

            return {
              id: unit.id,
              unit: LABELS[unit.type],
              name: makeUnitName(unit),
              user: hasViewUsersPermissions ? (
                <Link href={`/admin/manage/users/${unit.userId}`}>
                  <a
                    href={`/admin/manage/users/${unit.userId}`}
                    className={`rounded-md transition-all p-1 px-1.5 ${buttonVariants.default}`}
                  >
                    {unit.user.username}
                  </a>
                </Link>
              ) : (
                unit.user.username
              ),
              callsign: generateCallsign(unit),
              badgeNumber: unit.badgeNumber,
              department: formatOfficerDepartment(unit) ?? common("none"),
              departmentStatus: (
                <Status state={departmentStatus}>{departmentStatusFormatted}</Status>
              ),
              division: formatUnitDivisions(unit),
              rank: <OfficerRank unit={unit} />,
              position: unit.position ?? common("none"),
              status: unit.status?.value.value ?? common("none"),
              suspended: common(yesOrNoText(unit.suspended)),
              actions: (
                <>
                  {hasManagePermissions ? (
                    <Link href={`/admin/manage/units/${unit.id}`}>
                      <a
                        href={`/admin/manage/units/${unit.id}`}
                        className={classNames("p-0.5 px-2 rounded-md", buttonVariants.success)}
                      >
                        {common("manage")}
                      </a>
                    </Link>
                  ) : null}
                  {hasDeletePermissions ? (
                    <Button
                      size="xs"
                      className="ml-2"
                      onPress={() => handleDeleteClick(unit)}
                      variant="danger"
                    >
                      {common("delete")}
                    </Button>
                  ) : null}
                </>
              ),
            };
          })}
          columns={[
            { header: `${t("Ems.deputy")}/${t("Leo.officer")}`, accessorKey: "unit" },
            { header: common("name"), accessorKey: "name" },
            { header: common("user"), accessorKey: "user" },
            { header: t("Leo.callsign"), accessorKey: "callsign" },
            BADGE_NUMBERS ? { header: t("Leo.badgeNumber"), accessorKey: "badgeNumber" } : null,
            { header: t("Leo.department"), accessorKey: "department" },
            DIVISIONS ? { header: t("Leo.division"), accessorKey: "division" } : null,
            { header: t("Leo.rank"), accessorKey: "rank" },
            { header: t("Leo.position"), accessorKey: "position" },
            { header: t("Leo.status"), accessorKey: "status" },
            { header: t("Leo.suspended"), accessorKey: "suspended" },
            { header: t("Leo.status"), accessorKey: "departmentStatus" },
            hasManagePermissions || hasDeletePermissions
              ? { header: common("actions"), accessorKey: "actions" }
              : null,
          ]}
        />
      )}

      {tempUnit ? (
        <AlertModal
          title={t("Management.deleteUnit")}
          id={ModalIds.AlertDeleteUnit}
          onDeleteClick={handleDeleteUnit}
          state={state}
          description={t.rich("Management.alert_deleteUnit", {
            span: (c) => <span className="font-bold">{c}</span>,
            unit: `${generateCallsign(tempUnit)} ${makeUnitName(tempUnit)}`,
          })}
          onClose={() => unitState.setTempId(null)}
        />
      ) : null}
    </TabsContent>
  );
}
