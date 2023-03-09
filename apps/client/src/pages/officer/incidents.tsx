import * as React from "react";
import { Layout } from "components/Layout";
import { getSessionUser } from "lib/auth";
import { getTranslations } from "lib/getTranslation";
import { requestAll } from "lib/utils";
import type { GetServerSideProps } from "next";
import { useTranslations } from "use-intl";
import { useModal } from "state/modalState";
import { Button } from "@snailycad/ui";
import { ModalIds } from "types/ModalIds";
import { useLeoState } from "state/leo-state";
import { Title } from "components/shared/Title";
import { usePermission, Permissions } from "hooks/usePermission";
import type { GetActiveOfficerData, GetDispatchData, GetIncidentsData } from "@snailycad/types/api";
import { IncidentsTable } from "components/leo/incidents/incidents-table";

interface Props extends GetDispatchData {
  incidents: GetIncidentsData<"leo">;
  activeOfficer: GetActiveOfficerData | null;
}

export default function LeoIncidents({ activeOfficer, incidents: initialData }: Props) {
  const t = useTranslations("Leo");
  const { openModal } = useModal();
  const setActiveOfficer = useLeoState((state) => state.setActiveOfficer);
  const { hasPermissions } = usePermission();

  const isOfficerOnDuty =
    (activeOfficer && activeOfficer.status?.shouldDo !== "SET_OFF_DUTY") ?? false;

  React.useEffect(() => {
    setActiveOfficer(activeOfficer);
  }, [setActiveOfficer, activeOfficer]);

  return (
    <Layout
      permissions={{
        fallback: (u) => u.isLeo,
        permissions: [Permissions.ViewIncidents, Permissions.ManageIncidents],
      }}
      className="dark:text-white"
    >
      <header className="flex items-center justify-between">
        <Title className="!mb-0">{t("incidents")}</Title>

        {hasPermissions([Permissions.ManageIncidents], true) ? (
          <Button
            title={!isOfficerOnDuty ? "You must have an active officer." : ""}
            disabled={!isOfficerOnDuty}
            onPress={() => openModal(ModalIds.ManageIncident)}
          >
            {t("createIncident")}
          </Button>
        ) : null}
      </header>

      <IncidentsTable initialData={initialData} isUnitOnDuty={isOfficerOnDuty} type="leo" />
    </Layout>
  );
}

export const getServerSideProps: GetServerSideProps = async ({ req, locale }) => {
  const user = await getSessionUser(req);
  const [incidents, activeOfficer, values] = await requestAll(req, [
    ["/incidents", { incidents: [], totalCount: 0 }],
    ["/leo/active-officer", null],
    ["/admin/values/codes_10", []],
  ]);

  return {
    props: {
      session: user,
      incidents,
      activeOfficer,
      values,
      messages: {
        ...(await getTranslations(["leo", "calls", "common"], user?.locale ?? locale)),
      },
    },
  };
};
