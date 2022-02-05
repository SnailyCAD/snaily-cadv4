import dynamic from "next/dynamic";
import { AdminLayout } from "components/admin/AdminLayout";
import { getSessionUser } from "lib/auth";
import { getTranslations } from "lib/getTranslation";
import { requestAll } from "lib/utils";
import type { GetServerSideProps } from "next";
import type { FullDeputy, FullOfficer } from "state/dispatchState";
import { useTranslations } from "use-intl";
import { Title } from "components/shared/Title";
import { TabList } from "components/shared/TabList";
import { AllUnitsTab } from "components/admin/manage/units/AllUnitsTab";
import { WhitelistStatus } from "@snailycad/types";

const DepartmentWhitelistingTab = dynamic(
  async () =>
    (await import("components/admin/manage/units/DepartmentWhitelistingTab"))
      .DepartmentWhitelistingTab,
);

export type Unit = (FullOfficer & { type: "OFFICER" }) | (FullDeputy & { type: "DEPUTY" });

interface Props {
  units: Unit[];
}

export default function SupervisorPanelPage({ units }: Props) {
  const t = useTranslations();

  const pendingOfficers = units.filter(
    (v) => v.type === "OFFICER" && v.whitelistStatus?.status === WhitelistStatus.PENDING,
  );

  return (
    <AdminLayout>
      <Title>{t("Management.MANAGE_UNITS")}</Title>

      <h1 className="mb-4 text-3xl font-semibold">{t("Management.MANAGE_UNITS")}</h1>

      <TabList
        tabs={[
          { name: t("Management.allUnits"), value: "allUnits" },
          {
            name: t
              .rich("Management.departmentWhitelisting", { length: pendingOfficers.length })
              .toString(),
            value: "departmentWhitelisting",
          },
        ]}
      >
        <AllUnitsTab units={units} />
        <DepartmentWhitelistingTab pendingOfficers={pendingOfficers} />
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
