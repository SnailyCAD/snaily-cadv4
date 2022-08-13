import * as React from "react";
import type { Unit } from "src/pages/admin/manage/units";
import Link from "next/link";
import { formatUnitDivisions, makeUnitName, yesOrNoText, formatOfficerDepartment } from "lib/utils";
import { useTranslations } from "use-intl";
import { Button, buttonVariants } from "components/Button";
import { useGenerateCallsign } from "hooks/useGenerateCallsign";
import useFetch from "lib/useFetch";
import { useRouter } from "next/router";
import { IndeterminateCheckbox, Table } from "components/shared/Table";
import { TabsContent } from "components/shared/TabList";
import { useTableSelect } from "hooks/shared/useTableSelect";
import { Status } from "components/shared/Status";
import { usePermission, Permissions } from "hooks/usePermission";
import { useFeatureEnabled } from "hooks/useFeatureEnabled";
import { classNames } from "lib/classNames";
import { useModal } from "state/modalState";
import { ModalIds } from "types/ModalIds";
import { AlertModal } from "components/modal/AlertModal";
import { OfficerRank } from "components/leo/OfficerRank";
import { Checkbox } from "components/form/inputs/Checkbox";
import type {
  DeleteManageUnitByIdData,
  GetManageUnitsData,
  PutManageUnitsOffDutyData,
} from "@snailycad/types/api";
import { useTemporaryItem } from "hooks/shared/useTemporaryItem";

interface Props {
  units: GetManageUnitsData;
  search: string;
}

export function AllUnitsTab({ search, units }: Props) {
  const [tempUnit, unitState] = useTemporaryItem(units);

  const tableSelect = useTableSelect(units, (u) => `${u.id}-${u.type}`);
  const { hasPermissions } = usePermission();
  const hasManagePermissions = hasPermissions([Permissions.ManageUnits], true);
  const hasDeletePermissions = hasPermissions([Permissions.DeleteUnits], true);
  const { state, execute } = useFetch();

  const t = useTranslations();
  const common = useTranslations("Common");
  const { generateCallsign } = useGenerateCallsign();
  const router = useRouter();
  const { BADGE_NUMBERS } = useFeatureEnabled();
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
    if (tableSelect.selectedRows.length <= 0) return;

    const { json } = await execute<PutManageUnitsOffDutyData>({
      path: "/admin/manage/units/off-duty",
      method: "PUT",
      data: { ids: tableSelect.selectedRows },
    });

    if (Array.isArray(json)) {
      tableSelect.resetRows();
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
          disabled={tableSelect.selectedRows.length <= 0}
          onClick={setSelectedUnitsOffDuty}
          className="mt-3"
        >
          {t("Management.setSelectedOffDuty")}
        </Button>
      ) : null}

      {units.length <= 0 ? (
        <p>{t("Management.noUnits")}</p>
      ) : (
        <Table
          filter={search}
          data={units.map((unit) => {
            const departmentStatus = unit.whitelistStatus?.status;
            const departmentStatusFormatted = departmentStatus
              ? departmentStatus.toLowerCase()
              : "—";

            return {
              dropdown: (
                <Checkbox
                  checked={tableSelect.selectedRows.includes(`${unit.id}-${unit.type}`)}
                  onChange={() => tableSelect.handleCheckboxChange(unit)}
                />
              ),
              unit: LABELS[unit.type],
              name: makeUnitName(unit),
              user: (
                <Link href={`/admin/manage/users/${unit.userId}`}>
                  <a
                    href={`/admin/manage/users/${unit.userId}`}
                    className={`rounded-md transition-all p-1 px-1.5 ${buttonVariants.default}`}
                  >
                    {unit.user.username}
                  </a>
                </Link>
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
                      onClick={() => handleDeleteClick(unit)}
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
            hasManagePermissions
              ? {
                  Header: (
                    <IndeterminateCheckbox
                      onChange={tableSelect.handleAllCheckboxes}
                      checked={tableSelect.isTopCheckboxChecked}
                      indeterminate={tableSelect.isIntermediate}
                    />
                  ),
                  accessor: "dropdown",
                  enableSorting: false,
                }
              : null,
            { Header: `${t("Ems.deputy")}/${t("Leo.officer")}`, accessor: "unit" },
            { Header: common("name"), accessor: "name" },
            { Header: common("user"), accessor: "user" },
            { Header: t("Leo.callsign"), accessor: "callsign" },
            BADGE_NUMBERS ? { Header: t("Leo.badgeNumber"), accessor: "badgeNumber" } : null,
            { Header: t("Leo.department"), accessor: "department" },
            { Header: t("Leo.division"), accessor: "division" },
            { Header: t("Leo.rank"), accessor: "rank" },
            { Header: t("Leo.position"), accessor: "position" },
            { Header: t("Leo.status"), accessor: "status" },
            { Header: t("Leo.suspended"), accessor: "suspended" },
            { Header: t("Leo.status"), accessor: "departmentStatus" },
            hasManagePermissions || hasDeletePermissions
              ? { Header: common("actions"), accessor: "actions" }
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
