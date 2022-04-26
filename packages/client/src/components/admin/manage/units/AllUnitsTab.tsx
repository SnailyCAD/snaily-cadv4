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
import { isUnitOfficer } from "@snailycad/utils";
import { usePermission, Permissions } from "hooks/usePermission";
import { useFeatureEnabled } from "hooks/useFeatureEnabled";

interface Props {
  units: Unit[];
}

export function AllUnitsTab({ units }: Props) {
  const tableSelect = useTableSelect(units, (u) => `${u.id}-${u.type}`);
  const { hasPermissions } = usePermission();
  const hasManagePermissions = hasPermissions([Permissions.ManageUnits], true);

  const t = useTranslations();
  const common = useTranslations("Common");
  const { generateCallsign } = useGenerateCallsign();
  const { execute } = useFetch();
  const router = useRouter();
  const { BADGE_NUMBERS } = useFeatureEnabled();

  async function setSelectedUnitsOffDuty() {
    if (tableSelect.selectedRows.length <= 0) return;

    const { json } = await execute("/admin/manage/units/off-duty", {
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
          disabledColumnId={["dropdown"]}
          data={units.map((unit) => {
            const departmentStatus = isUnitOfficer(unit) ? unit.whitelistStatus?.status : null;
            const departmentStatusFormatted = departmentStatus
              ? departmentStatus.toLowerCase()
              : "—";

            return {
              dropdown: (
                <input
                  checked={tableSelect.selectedRows.includes(`${unit.id}-${unit.type}`)}
                  onChange={() => tableSelect.handleCheckboxChange(unit)}
                  type="checkbox"
                />
              ),
              unit: LABELS[unit.type],
              name: makeUnitName(unit),
              user: (
                <Link href={`/admin/manage/users/${unit.userId}`}>
                  <a className={`rounded-md transition-all p-1 px-1.5 ${buttonVariants.default}`}>
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
              rank: unit.rank?.value ?? common("none"),
              status: unit.status?.value.value ?? common("none"),
              suspended: common(yesOrNoText(unit.suspended)),
              actions: (
                <Link href={`/admin/manage/units/${unit.id}`}>
                  <a>
                    <Button small variant="success">
                      {common("manage")}
                    </Button>
                  </a>
                </Link>
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
            { Header: t("Leo.status"), accessor: "status" },
            { Header: t("Leo.suspended"), accessor: "suspended" },
            { Header: t("Leo.status"), accessor: "departmentStatus" },
            hasManagePermissions ? { Header: common("actions"), accessor: "actions" } : null,
          ]}
        />
      )}
    </TabsContent>
  );
}
