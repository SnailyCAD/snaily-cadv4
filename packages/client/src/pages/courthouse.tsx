import { Layout } from "components/Layout";
import { getSessionUser } from "lib/auth";
import { getTranslations } from "lib/getTranslation";
import type { GetServerSideProps } from "next";
import type {
  ExpungementRequest,
  NameChangeRequest,
  Warrant,
  Citizen,
  Record,
  CourtEntry,
} from "@snailycad/types";
import { useTranslations } from "use-intl";
import { requestAll } from "lib/utils";
import { Title } from "components/shared/Title";
import { TabList } from "components/shared/TabList";
import { ExpungementRequestsTab } from "components/courthouse/expungement-requests/ExpungementRequestsTab";
import { NameChangeRequestTab } from "components/courthouse/name-change/NameChangeRequestTab";
import { CourtEntriesTab } from "components/courthouse/court-entries/CourtEntriesTab";
import { usePermission, Permissions } from "hooks/usePermission";

export type FullRequest = ExpungementRequest & {
  warrants: Warrant[];
  records: Record[];
  citizen: Citizen;
};

interface Props {
  requests: FullRequest[];
  nameChangeRequests: NameChangeRequest[];
  courtEntries: CourtEntry[];
}

export default function Courthouse(props: Props) {
  const t = useTranslations("Courthouse");
  const { hasPermissions } = usePermission();
  const hasEntriesPerms = hasPermissions([Permissions.Leo], (u) => u.isLeo);

  const TABS = [
    { name: t("expungementRequests"), value: "expungementRequestsTab" },
    { name: t("nameChangeRequests"), value: "nameChangeRequestsTab" },
  ];

  if (hasEntriesPerms) {
    TABS[2] = { name: t("courtEntries"), value: "courtEntriesTab" };
  }

  return (
    <Layout className="dark:text-white">
      <Title className="mb-3">{t("courthouse")}</Title>

      <TabList tabs={TABS}>
        <ExpungementRequestsTab requests={props.requests} />
        <NameChangeRequestTab requests={props.nameChangeRequests} />
        {hasEntriesPerms ? <CourtEntriesTab entries={props.courtEntries} /> : null}
      </TabList>
    </Layout>
  );
}

export const getServerSideProps: GetServerSideProps = async ({ locale, req }) => {
  const [data, nameChangeRequests, courtEntries, citizens] = await requestAll(req, [
    ["/expungement-requests", []],
    ["/name-change", []],
    ["/court-entries", []],
    ["/citizen", []],
  ]);

  return {
    props: {
      requests: data,
      nameChangeRequests,
      citizens,
      courtEntries,
      session: await getSessionUser(req),
      messages: {
        ...(await getTranslations(["courthouse", "leo", "common"], locale)),
      },
    },
  };
};
