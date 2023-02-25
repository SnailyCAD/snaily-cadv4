import dynamic from "next/dynamic";
import { AdminLayout } from "components/admin/AdminLayout";
import { getSessionUser } from "lib/auth";
import { getTranslations } from "lib/getTranslation";
import { requestAll } from "lib/utils";
import type { GetServerSideProps } from "next";
import { useTranslations } from "use-intl";
import { Title } from "components/shared/Title";
import { TabList } from "@snailycad/ui";
import { Rank, ValueType } from "@snailycad/types";
import { usePermission, Permissions } from "hooks/usePermission";
import type { GetManageUnitsData } from "@snailycad/types/api";
import { AllUnitsTab } from "components/admin/manage/units/tabs/all-units-tab";
import { useLoadValuesClientSide } from "hooks/useLoadValuesClientSide";

const DepartmentWhitelistingTab = dynamic(
  async () =>
    (await import("components/admin/manage/units/tabs/department-whitelisting-tab"))
      .DepartmentWhitelistingTab,
  { ssr: false },
);

const CallsignsTab = dynamic(
  async () =>
    (await import("components/admin/manage/units/tabs/callsigns-tab/callsigns-tab")).CallsignsTab,
  { ssr: false },
);

const DepartmentTimeLogsTab = dynamic(
  async () =>
    (
      await import(
        "components/admin/manage/units/tabs/department-time-logs/department-time-logs-table"
      )
    ).DepartmentTimeLogsTab,
  { ssr: false },
);

export type Unit = GetManageUnitsData["units"][number];

interface Props {
  units: GetManageUnitsData;
  pendingUnits: GetManageUnitsData;
}

export default function SupervisorPanelPage(props: Props) {
  const t = useTranslations();
  const { hasPermissions } = usePermission();
  useLoadValuesClientSide({
    valueTypes: [ValueType.DEPARTMENT],
  });

  const hasViewPermissions = hasPermissions(
    [
      Permissions.ManageUnits,
      Permissions.ViewUnits,
      Permissions.DeleteUnits,
      Permissions.ManageAwardsAndQualifications,
    ],
    true,
  );
  const hasManagePermissions = hasPermissions([Permissions.ManageUnits], true);
  const hasManageCallsignPermissions = hasPermissions([Permissions.ManageUnitCallsigns], true);

  const TABS = [];

  if (hasViewPermissions) {
    TABS.push({ name: t("Management.allUnits"), value: "allUnits" });
  }

  if (hasManageCallsignPermissions) {
    TABS.push({
      name: t("Management.callsignManagement"),
      value: "callsignManagement",
    });
  }

  if (hasManagePermissions && props.pendingUnits.totalCount > 0) {
    TABS.push({
      name: t
        .rich("Management.departmentWhitelisting", { length: props.pendingUnits.totalCount })
        .toString(),
      value: "departmentWhitelisting",
    });
  }

  TABS.push({
    name: t("Management.departmentTimeLogs"),
    value: "departmentTimeLogs",
  });

  return (
    <AdminLayout
      permissions={{
        fallback: (u) => u.rank !== Rank.USER,
        permissions: [
          Permissions.ViewUnits,
          Permissions.DeleteUnits,
          Permissions.ManageUnits,
          Permissions.ManageUnitCallsigns,
          Permissions.ManageAwardsAndQualifications,
        ],
      }}
    >
      <Title>{t("Management.MANAGE_UNITS")}</Title>

      <TabList tabs={TABS}>
        <AllUnitsTab units={props.units} />
        {hasManageCallsignPermissions ? <CallsignsTab units={props.units} /> : null}
        {props.pendingUnits.totalCount > 0 && hasManagePermissions ? (
          <DepartmentWhitelistingTab pendingUnits={props.pendingUnits} />
        ) : null}
        <DepartmentTimeLogsTab />
      </TabList>
    </AdminLayout>
  );
}

export const getServerSideProps: GetServerSideProps<Props> = async ({ req, locale }) => {
  const user = await getSessionUser(req);
  const [units, pendingUnits] = await requestAll(req, [
    ["/admin/manage/units", { units: [], totalCount: 0 }],
    ["/admin/manage/units?pendingOnly=true", { units: [], totalCount: 0 }],
  ]);

  return {
    props: {
      units,
      pendingUnits,
      session: user,
      messages: {
        ...(await getTranslations(
          ["admin", "leo", "ems-fd", "values", "common"],
          user?.locale ?? locale,
        )),
      },
    },
  };
};
