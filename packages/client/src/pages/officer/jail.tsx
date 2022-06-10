import * as React from "react";
import { useTranslations } from "use-intl";
import { Button } from "components/Button";
import { Layout } from "components/Layout";
import { getSessionUser } from "lib/auth";
import { getTranslations } from "lib/getTranslation";
import { makeUnitName, requestAll } from "lib/utils";
import type { GetServerSideProps } from "next";
import { Record, Citizen, RecordRelease, ReleaseType } from "@snailycad/types";
import { useModal } from "state/modalState";
import { ModalIds } from "types/ModalIds";
import { Table } from "components/shared/Table";
import { useGenerateCallsign } from "hooks/useGenerateCallsign";
import compareDesc from "date-fns/compareDesc";
import { ReleaseCitizenModal } from "components/leo/jail/ReleaseCitizenModal";
import { useRouter } from "next/router";
import { Title } from "components/shared/Title";
import { FullDate } from "components/shared/FullDate";
import { usePermission, Permissions } from "hooks/usePermission";
import { useFeatureEnabled } from "hooks/useFeatureEnabled";
import { NameSearchModal } from "components/leo/modals/NameSearchModal/NameSearchModal";

interface Props {
  data: (Citizen & { Record: Record[] })[];
}

export default function Jail({ data: jailedCitizens }: Props) {
  const t = useTranslations("Leo");
  const common = useTranslations("Common");
  const { openModal, closeModal } = useModal();
  const { generateCallsign } = useGenerateCallsign();
  const { hasPermissions } = usePermission();
  const router = useRouter();
  const { SOCIAL_SECURITY_NUMBERS } = useFeatureEnabled();

  const [tempCitizen, setTempCitizen] = React.useState<(Citizen & { recordId: string }) | null>(
    null,
  );

  function handleSuccess() {
    router.replace({ pathname: router.pathname, query: router.query });
    setTempCitizen(null);
    closeModal(ModalIds.AlertReleaseCitizen);
  }

  function handleCheckoutClick(item: Citizen, recordId: string) {
    setTempCitizen({ ...item, recordId });
    openModal(ModalIds.AlertReleaseCitizen);
  }

  function handleNameClick(item: Citizen) {
    openModal(ModalIds.NameSearch, { name: `${item.name} ${item.surname}` });
  }

  return (
    <Layout
      permissions={{
        fallback: (u) => u.isLeo,
        permissions: [Permissions.ViewJail, Permissions.ManageJail],
      }}
      className="dark:text-white"
    >
      <Title>{t("jail")}</Title>

      {jailedCitizens.length <= 0 ? (
        <p className="mt-5">{t("noImprisonedCitizens")}</p>
      ) : (
        <Table
          defaultSort={{ columnId: "createdAt", descending: true }}
          data={jailedCitizens.map((item) => {
            const [record] = item.Record.sort((a, b) =>
              compareDesc(new Date(a.createdAt), new Date(b.createdAt)),
            ).filter((v) => v.type === "ARREST_REPORT");

            if (!record) return {};

            const jailTime = record.violations.reduce((ac, cv) => ac + (cv.jailTime || 0), 0);
            const released = isReleased(record);
            const type = released && record.release.type;
            const citizen = released ? record.release.releasedBy : null;

            const status = !released
              ? t("arrested")
              : type === ReleaseType.TIME_OUT
              ? t("timeOut")
              : `Bail Posted (${citizen?.name} ${citizen?.surname})`;

            return {
              rowProps: { style: released ? { opacity: "0.5" } : undefined },
              citizen: (
                <Button onClick={() => handleNameClick(item)}>
                  {item.name} {item.surname}{" "}
                  {SOCIAL_SECURITY_NUMBERS && item.socialSecurityNumber
                    ? `(SSN: ${item.socialSecurityNumber})`
                    : null}
                </Button>
              ),
              officer: `${generateCallsign(record.officer)} ${makeUnitName(record.officer)}`,
              jailTime,
              status,
              createdAt: <FullDate>{record.createdAt}</FullDate>,
              actions: (
                <Button
                  disabled={released}
                  onClick={() => handleCheckoutClick(item, record.id)}
                  className="ml-2"
                  small
                >
                  {t("release")}
                </Button>
              ),
            };
          })}
          columns={[
            { Header: t("citizen"), accessor: "citizen" },
            { Header: t("officer"), accessor: "officer" },
            { Header: t("jailTime"), accessor: "jailTime" },
            { Header: t("status"), accessor: "status" },
            { Header: common("createdAt"), accessor: "createdAt" },
            hasPermissions([Permissions.ManageJail], true)
              ? { Header: common("actions"), accessor: "actions" }
              : null,
          ]}
        />
      )}

      <NameSearchModal />
      <ReleaseCitizenModal onSuccess={handleSuccess} citizen={tempCitizen} />
    </Layout>
  );
}

export const getServerSideProps: GetServerSideProps = async ({ req, locale }) => {
  const [jailData] = await requestAll(req, [["/leo/jail", []]]);

  return {
    props: {
      session: await getSessionUser(req),
      data: jailData,
      messages: {
        ...(await getTranslations(["leo", "ems-fd", "citizen", "common"], locale)),
      },
    },
  };
};

function isReleased<T extends Record = Record>(
  record: T,
): record is T & { release: RecordRelease } {
  return record.releaseId !== null;
}
