import * as React from "react";
import dynamic from "next/dynamic";
import { AdminLayout } from "components/admin/AdminLayout";
import { getSessionUser } from "lib/auth";
import { getTranslations } from "lib/getTranslation";
import { getUnitDepartment, requestAll } from "lib/utils";
import type { GetServerSideProps } from "next";
import { useTranslations } from "use-intl";
import { Title } from "components/shared/Title";
import { TabList } from "components/shared/TabList";
import { AllUnitsTab } from "components/admin/manage/units/AllUnitsTab";
import { EmsFdDeputy, Officer, WhitelistStatus, Rank } from "@snailycad/types";
import { usePermission, Permissions } from "hooks/usePermission";
import { FormField } from "components/form/FormField";
import { Select } from "components/form/Select";
import { FormRow } from "components/form/FormRow";
import { Input } from "components/form/inputs/Input";
import { CallsignsTab } from "components/admin/manage/units/CallsignsTab";

const DepartmentWhitelistingTab = dynamic(
  async () =>
    (await import("components/admin/manage/units/DepartmentWhitelistingTab"))
      .DepartmentWhitelistingTab,
);

export type Unit = (Officer & { type: "OFFICER" }) | (EmsFdDeputy & { type: "DEPUTY" });

interface Props {
  units: Unit[];
}

export default function SupervisorPanelPage({ units }: Props) {
  const t = useTranslations();
  const { hasPermissions } = usePermission();
  const hasManagePermissions = hasPermissions([Permissions.ManageUnits], true);
  const hasManageCallsignPermissions = hasPermissions([Permissions.ManageUnitCallsigns], true);

  const [filter, setFilter] = React.useState("");
  const [search, setSearch] = React.useState("");

  const pendingOfficers = units.filter(
    (v) => v.type === "OFFICER" && v.whitelistStatus?.status === WhitelistStatus.PENDING,
  );

  const TABS = [{ name: t("Management.allUnits"), value: "allUnits" }];

  if (hasManageCallsignPermissions) {
    TABS[1] = {
      name: t("Management.callsignManagement"),
      value: "callsignManagement",
    };
  }

  if (hasManagePermissions) {
    const idx = hasManageCallsignPermissions ? 2 : 1;

    TABS[idx] = {
      name: t
        .rich("Management.departmentWhitelisting", { length: pendingOfficers.length })
        .toString(),
      value: "departmentWhitelisting",
    };
  }

  const departmentFilters: [string, string][] = Object.entries(
    units.reduce((ac, cv) => {
      const department = getUnitDepartment(cv);

      return {
        ...ac,
        [department?.id ?? "null"]: department?.value.value ?? t("Common.none"),
      };
    }, {}),
  );

  return (
    <AdminLayout
      permissions={{
        fallback: (u) => u.rank !== Rank.USER,
        permissions: [
          Permissions.ViewUnits,
          Permissions.DeleteUnits,
          Permissions.ManageUnits,
          Permissions.ManageUnitCallsigns,
        ],
      }}
    >
      <Title>{t("Management.MANAGE_UNITS")}</Title>

      <FormRow flexLike>
        <FormField className="w-full" label={t("Common.search")}>
          <Input value={search} onChange={(e) => setSearch(e.target.value)} />
        </FormField>

        <FormField className="w-60" label="Filter by Department">
          <Select
            isClearable
            values={departmentFilters.map(([value, label]) => ({
              value,
              label,
            }))}
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
        </FormField>
      </FormRow>

      <TabList tabs={TABS}>
        <AllUnitsTab
          search={search}
          units={units.filter((v) => (filter ? getUnitDepartment(v)?.id === filter : true))}
        />
        <DepartmentWhitelistingTab
          search={search}
          pendingOfficers={pendingOfficers.filter((v) =>
            filter ? getUnitDepartment(v)?.id === filter : true,
          )}
        />
        {hasManageCallsignPermissions ? <CallsignsTab search={search} units={units} /> : null}
      </TabList>
    </AdminLayout>
  );
}

export const getServerSideProps: GetServerSideProps = async ({ req, locale }) => {
  const [units] = await requestAll(req, [["/admin/manage/units", []]]);

  return {
    props: {
      units,
      session: await getSessionUser(req),
      messages: {
        ...(await getTranslations(["admin", "leo", "ems-fd", "values", "common"], locale)),
      },
    },
  };
};
