import { AdminLayout } from "components/admin/AdminLayout";
import { getSessionUser } from "lib/auth";
import { getTranslations } from "lib/getTranslation";
import { makeUnitName, requestAll } from "lib/utils";
import type { GetServerSideProps } from "next";
import { useTranslations } from "use-intl";
import { ValueType, WhitelistStatus } from "@snailycad/types";
import { Title } from "components/shared/Title";
import { Permissions } from "@snailycad/permissions";
import { useLoadValuesClientSide } from "hooks/useLoadValuesClientSide";
import type { GetManageUnitByIdData } from "@snailycad/types/api";
import { ManageUnitTab } from "components/admin/manage/units/tabs/manage-unit-tab/manage-unit-tab";
import { UnitLogsTab } from "components/admin/manage/units/tabs/manage-unit-tab/unit-logs-tab";
import { TabList, BreadcrumbItem, Breadcrumbs, Alert } from "@snailycad/ui";
import { useGenerateCallsign } from "hooks/useGenerateCallsign";
import { usePermission } from "hooks/usePermission";
import Link from "next/link";

interface Props {
  unit: GetManageUnitByIdData;
}

export default function SupervisorPanelPage({ unit: data }: Props) {
  useLoadValuesClientSide({ valueTypes: [ValueType.QUALIFICATION] });

  const { hasPermissions } = usePermission();

  const hasManagePermissions = hasPermissions([Permissions.ManageUnits]);
  const hasManageCallsignPermissions = hasPermissions([Permissions.ManageUnitCallsigns]);
  const hasManageAwardsPermissions = hasPermissions([Permissions.ManageAwardsAndQualifications]);

  const { generateCallsign } = useGenerateCallsign();
  const tAdmin = useTranslations("Management");

  const TABS = [];
  let index = 0;

  if (hasManageAwardsPermissions || hasManagePermissions) {
    TABS[index] = { name: "Manage Unit", value: "manage-unit" };
    index += 1;
  }

  if (hasManageCallsignPermissions) {
    TABS[index] = { name: "Unit Logs", value: "unit-logs" };
    index += 1;
  }

  return (
    <AdminLayout
      permissions={{
        permissions: [Permissions.ManageUnits, Permissions.ManageAwardsAndQualifications],
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

      {data.whitelistStatus?.status === WhitelistStatus.PENDING ? (
        <Alert className="my-5" type="warning" title="Unit is pending approval">
          <p>
            This unit is still pending approval. It must first be approved by an administrator
            before any changes can be done.{" "}
            <Link className="font-medium underline" href="/admin/manage/units">
              Go back
            </Link>
          </p>
        </Alert>
      ) : null}

      <TabList tabs={TABS}>
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
