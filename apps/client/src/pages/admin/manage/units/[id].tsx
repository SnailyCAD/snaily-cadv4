import * as React from "react";
import { AdminLayout } from "components/admin/AdminLayout";
import { getSessionUser } from "lib/auth";
import { getTranslations } from "lib/getTranslation";
import { makeUnitName, requestAll } from "lib/utils";
import type { GetServerSideProps } from "next";
import { useTranslations } from "use-intl";
import { Rank, ValueType } from "@snailycad/types";
import { Title } from "components/shared/Title";
import { Permissions } from "@snailycad/permissions";
import { useLoadValuesClientSide } from "hooks/useLoadValuesClientSide";
import type { GetManageUnitByIdData } from "@snailycad/types/api";
import { TabList } from "components/shared/TabList";
import { ManageUnitTab } from "components/admin/manage/units/tabs/manage-unit-tab/ManageUnitTab";
import { UnitLogsTab } from "components/admin/manage/units/tabs/manage-unit-tab/UnitLogsTab";
import { BreadcrumbItem, Breadcrumbs } from "@snailycad/ui";
import { useGenerateCallsign } from "hooks/useGenerateCallsign";

interface Props {
  unit: GetManageUnitByIdData;
}

export default function SupervisorPanelPage({ unit: data }: Props) {
  useLoadValuesClientSide({ valueTypes: [ValueType.QUALIFICATION] });

  const { generateCallsign } = useGenerateCallsign();
  const tAdmin = useTranslations("Management");

  return (
    <AdminLayout
      permissions={{
        fallback: (u) => u.rank !== Rank.USER,
        permissions: [Permissions.ManageUnits],
      }}
    >
      <Breadcrumbs>
        <BreadcrumbItem href="/admin/manage/units">{tAdmin("MANAGE_UNITS")}</BreadcrumbItem>
        <BreadcrumbItem>{tAdmin("editUnit")}</BreadcrumbItem>
        <BreadcrumbItem>
          {generateCallsign(data)} {makeUnitName(data)}
        </BreadcrumbItem>
      </Breadcrumbs>

      <Title renderLayoutTitle={false} className="mb-2">
        {tAdmin("editUnit")}
      </Title>

      <TabList
        tabs={[
          { name: "Manage Unit", value: "manage-unit" },
          { name: "Unit Logs", value: "unit-logs" },
        ]}
      >
        <ManageUnitTab unit={data} />
        <UnitLogsTab unit={data} />
      </TabList>
    </AdminLayout>
  );
}

export const getServerSideProps: GetServerSideProps<Props> = async ({ query, req, locale }) => {
  const user = await getSessionUser(req);
  const [unit, values] = await requestAll(req, [
    [`/admin/manage/units/${query.id}`, null],
    ["/admin/values/codes_10?paths=department,division,officer_rank", []],
  ]);

  if (!unit) {
    return { notFound: true };
  }

  return {
    props: {
      unit,
      values,
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
