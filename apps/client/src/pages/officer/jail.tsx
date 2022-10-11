import * as React from "react";
import { useTranslations } from "use-intl";
import { Button } from "@snailycad/ui";
import { Layout } from "components/Layout";
import { getSessionUser } from "lib/auth";
import { getTranslations } from "lib/getTranslation";
import { makeUnitName, requestAll } from "lib/utils";
import type { GetServerSideProps } from "next";
import { Record, BaseCitizen, RecordRelease, ReleaseType, ValueType } from "@snailycad/types";
import { useModal } from "state/modalState";
import { ModalIds } from "types/ModalIds";
import { Table, useTableState } from "components/shared/Table";
import { useGenerateCallsign } from "hooks/useGenerateCallsign";
import compareDesc from "date-fns/compareDesc";
import { ReleaseCitizenModal } from "components/leo/jail/ReleaseCitizenModal";
import { Title } from "components/shared/Title";
import { FullDate } from "components/shared/FullDate";
import { usePermission, Permissions } from "hooks/usePermission";
import { useFeatureEnabled } from "hooks/useFeatureEnabled";
import { NameSearchModal } from "components/leo/modals/NameSearchModal/NameSearchModal";
import { useAsyncTable } from "hooks/shared/table/useAsyncTable";
import type { GetJailedCitizensData } from "@snailycad/types/api";
import { useLoadValuesClientSide } from "hooks/useLoadValuesClientSide";

interface Props {
  data: GetJailedCitizensData;
}

export default function Jail({ data }: Props) {
  useLoadValuesClientSide({
    valueTypes: [ValueType.PENAL_CODE],
  });

  const asyncTable = useAsyncTable({
    initialData: data.jailedCitizens,
    totalCount: data.totalCount,
    fetchOptions: {
      onResponse: (json: GetJailedCitizensData) => ({
        data: json.jailedCitizens,
        totalCount: json.totalCount,
      }),
      path: "/leo/jail",
    },
  });

  const tableState = useTableState({
    pagination: asyncTable.pagination,
  });

  const t = useTranslations("Leo");
  const common = useTranslations("Common");
  const { openModal, closeModal } = useModal();
  const { generateCallsign } = useGenerateCallsign();
  const { hasPermissions } = usePermission();
  const { SOCIAL_SECURITY_NUMBERS } = useFeatureEnabled();

  const [tempCitizen, setTempCitizen] = React.useState<(BaseCitizen & { recordId: string }) | null>(
    null,
  );

  function handleSuccess(citizen: BaseCitizen & { Record: Record[] }) {
    const newData = [...asyncTable.data];
    const idx = newData.findIndex((v) => v.id === citizen.id);
    newData[idx] = citizen;

    asyncTable.setData(newData);

    setTempCitizen(null);
    closeModal(ModalIds.AlertReleaseCitizen);
  }

  function handleCheckoutClick(item: BaseCitizen & { Record: Record[] }, recordId: string) {
    setTempCitizen({ ...item, recordId });
    openModal(ModalIds.AlertReleaseCitizen);
  }

  function handleNameClick(item: BaseCitizen & { Record: Record[] }) {
    openModal(ModalIds.NameSearch, { ...item, name: `${item.name} ${item.surname}` });
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

      {data.jailedCitizens.length <= 0 ? (
        <p className="mt-5">{t("noImprisonedCitizens")}</p>
      ) : (
        <Table
          tableState={tableState}
          data={asyncTable.data.map((item) => {
            const [record] = item.Record.sort((a, b) =>
              compareDesc(new Date(a.createdAt), new Date(b.createdAt)),
            ).filter((v) => v.type === "ARREST_REPORT");

            if (!record) {
              return {
                id: item.id,
              };
            }

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
              id: item.id,
              caseNumber: `#${record.caseNumber}`,
              citizen: (
                <Button onPress={() => handleNameClick(item)}>
                  {item.name} {item.surname}{" "}
                  {SOCIAL_SECURITY_NUMBERS && item.socialSecurityNumber
                    ? `(SSN: ${item.socialSecurityNumber})`
                    : null}
                </Button>
              ),
              officer: record.officer
                ? `${generateCallsign(record.officer)} ${makeUnitName(record.officer)}`
                : common("none"),
              jailTime,
              status,
              createdAt: <FullDate>{record.createdAt}</FullDate>,
              actions: (
                <Button
                  disabled={released}
                  onPress={() => handleCheckoutClick(item, record.id)}
                  className="ml-2"
                  size="xs"
                >
                  {t("release")}
                </Button>
              ),
            };
          })}
          columns={[
            { header: t("caseNumber"), accessorKey: "caseNumber" },
            { header: t("citizen"), accessorKey: "citizen" },
            { header: t("officer"), accessorKey: "officer" },
            { header: t("jailTime"), accessorKey: "jailTime" },
            { header: t("status"), accessorKey: "status" },
            { header: common("createdAt"), accessorKey: "createdAt" },
            hasPermissions([Permissions.ManageJail], true)
              ? { header: common("actions"), accessorKey: "actions" }
              : null,
          ]}
        />
      )}

      <NameSearchModal />
      <ReleaseCitizenModal onSuccess={handleSuccess} citizen={tempCitizen} />
    </Layout>
  );
}

export const getServerSideProps: GetServerSideProps<Props> = async ({ req, locale }) => {
  const user = await getSessionUser(req);
  const [jailData] = await requestAll(req, [["/leo/jail", { jailedCitizens: [], totalCount: 0 }]]);

  return {
    props: {
      session: user,
      data: jailData,
      messages: {
        ...(await getTranslations(["leo", "ems-fd", "citizen", "common"], user?.locale ?? locale)),
      },
    },
  };
};

function isReleased<T extends Record = Record>(
  record: T,
): record is T & { release: RecordRelease } {
  return record.releaseId !== null;
}
