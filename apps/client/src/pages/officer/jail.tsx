import * as React from "react";
import { useTranslations } from "use-intl";
import { Button, Input } from "@snailycad/ui";
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
import { useAsyncTable } from "hooks/shared/table/use-async-table";
import type { GetJailedCitizensData } from "@snailycad/types/api";
import { useLoadValuesClientSide } from "hooks/useLoadValuesClientSide";
import { RecordsCaseNumberColumn } from "components/leo/records-case-number-column";
import { FormField } from "components/form/FormField";

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

  function handleSuccess(releasedCitizenData: BaseCitizen & { Record: Record[]; record: Record }) {
    asyncTable.update(releasedCitizenData.id, releasedCitizenData);

    setTempCitizen(null);
    closeModal(ModalIds.AlertReleaseCitizen);
  }

  function handleCheckoutClick(item: BaseCitizen & { record: Record }, recordId: string) {
    setTempCitizen({ ...item, recordId });
    openModal(ModalIds.AlertReleaseCitizen);
  }

  function handleNameClick(item: BaseCitizen & { Record: Record[]; record: Record }) {
    openModal(ModalIds.NameSearch, { ...item, name: `${item.name} ${item.surname}` });
  }

  const _itemsWithArrestReportSortedByCreatedAt = React.useMemo(() => {
    const records = [];

    for (const citizen of asyncTable.items) {
      const [record] = citizen.Record.sort((a, b) =>
        compareDesc(new Date(a.createdAt), new Date(b.createdAt)),
      ).filter((v) => v.type === "ARREST_REPORT");

      if (record) {
        records.push({ ...citizen, record });
      }
    }

    return records;
  }, [asyncTable.items]);

  return (
    <Layout
      permissions={{
        fallback: (u) => u.isLeo,
        permissions: [Permissions.ViewJail, Permissions.ManageJail],
      }}
      className="dark:text-white"
    >
      <header className="flex flex-col flex-start">
        <Title>{t("jail")}</Title>

        <FormField className="w-full" label="Show active only" checkbox>
          <Input
            checked={Boolean(asyncTable.filters?.activeOnly)}
            onChange={() => {
              asyncTable.setFilters((prev) => ({
                ...prev,
                activeOnly: !prev?.activeOnly,
              }));
            }}
            type="checkbox"
          />
        </FormField>
      </header>

      {_itemsWithArrestReportSortedByCreatedAt.length <= 0 ? (
        <p className="mt-5">{t("noImprisonedCitizens")}</p>
      ) : (
        <Table
          tableState={tableState}
          data={_itemsWithArrestReportSortedByCreatedAt.map((item) => {
            const jailTime = item.record?.violations.reduce((ac, cv) => ac + (cv.jailTime || 0), 0);
            const released = isReleased(item.record);
            const type = released && item.record.release?.type;
            const citizen = released ? item.record.release?.releasedBy : null;

            const status = !released
              ? t("arrested")
              : type === ReleaseType.BAIL_POSTED
              ? `Bail Posted (${citizen?.name} ${citizen?.surname})`
              : t("timeOut");

            return {
              rowProps: { style: released ? { opacity: "0.5" } : undefined },
              id: item.id,
              caseNumber: <RecordsCaseNumberColumn record={item.record} />,
              citizen: (
                <Button onPress={() => handleNameClick(item)}>
                  {item.name} {item.surname}{" "}
                  {SOCIAL_SECURITY_NUMBERS && item.socialSecurityNumber
                    ? `(SSN: ${item.socialSecurityNumber})`
                    : null}
                </Button>
              ),
              officer: item.record.officer
                ? `${generateCallsign(item.record.officer)} ${makeUnitName(item.record.officer)}`
                : common("none"),
              jailTime,
              status,
              createdAt: <FullDate>{item.record.createdAt}</FullDate>,
              actions: (
                <Button
                  disabled={released}
                  onPress={() => handleCheckoutClick(item, item.record.id)}
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
