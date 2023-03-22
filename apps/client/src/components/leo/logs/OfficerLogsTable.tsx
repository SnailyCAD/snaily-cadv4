import { FullDate } from "components/shared/FullDate";
import { Table, useAsyncTable, useTableState } from "components/shared/Table";
import formatDistance from "date-fns/formatDistance";
import { useImageUrl } from "hooks/useImageUrl";
import { makeUnitName } from "lib/utils";
import { useTranslations } from "next-intl";
import type { OfficerLogWithOfficer } from "src/pages/officer/my-officer-logs";
import type { EmsFdDeputy, Officer, OfficerLog } from "@snailycad/types";
import type { OfficerLogWithDeputy } from "src/pages/ems-fd/my-deputy-logs";
import { useGenerateCallsign } from "hooks/useGenerateCallsign";
import type { GetMyDeputiesLogsData, GetMyOfficersLogsData } from "@snailycad/types/api";
import { ImageWrapper } from "components/shared/image-wrapper";

type OfficerLogData = GetMyOfficersLogsData["logs"][number] | GetMyDeputiesLogsData["logs"][number];

type Props =
  | {
      unit?: never;
      asyncTable: ReturnType<typeof useAsyncTable<any>>;
    }
  | {
      unit: Officer | EmsFdDeputy | null;
      asyncTable: ReturnType<typeof useAsyncTable<any>>;
    };

export function OfficerLogsTable({ unit, asyncTable }: Props) {
  const { makeImageUrl } = useImageUrl();
  const { generateCallsign } = useGenerateCallsign();
  const tableState = useTableState({ pagination: asyncTable.pagination });
  const t = useTranslations("Leo");

  return (
    <Table
      tableState={tableState}
      data={(asyncTable.items as OfficerLogData[]).map((log) => {
        const startedAt = <FullDate>{log.startedAt}</FullDate>;
        const endedAt = log.endedAt ? <FullDate>{log.endedAt}</FullDate> : t("notEndedYet");
        const logUnit = getUnitFromLog(log) ?? unit;

        const totalTime =
          log.endedAt !== null
            ? `${formatDistance(new Date(log.endedAt), new Date(log.startedAt))}`
            : t("notEndedYet");

        if (!logUnit) {
          return { id: log.id };
        }

        return {
          id: log.id,
          unit: (
            <span className="flex items-center capitalize">
              {logUnit.imageId ? (
                <ImageWrapper
                  quality={70}
                  className="rounded-md w-[30px] h-[30px] object-cover mr-2"
                  draggable={false}
                  src={makeImageUrl("citizens", logUnit.imageId)!}
                  loading="lazy"
                  width={30}
                  height={30}
                  alt={`${logUnit.citizen.name} ${logUnit.citizen.surname}`}
                />
              ) : null}
              {generateCallsign(logUnit)} {makeUnitName(logUnit)}
            </span>
          ),
          startedAt,
          endedAt,
          totalTime,
        };
      })}
      columns={[
        { header: t("unit"), accessorKey: "unit" },
        { header: t("startedAt"), accessorKey: "startedAt" },
        { header: t("endedAt"), accessorKey: "endedAt" },
        { header: t("totalTime"), accessorKey: "totalTime" },
      ]}
    />
  );
}

function getUnitFromLog(log: OfficerLog | OfficerLogWithDeputy | OfficerLogWithOfficer) {
  if ("officer" in log) return log.officer;
  if ("emsFdDeputy" in log) return log.emsFdDeputy;
  return null;
}
