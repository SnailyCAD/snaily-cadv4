import { FullDate } from "components/shared/FullDate";
import { Table } from "components/shared/Table";
import formatDistance from "date-fns/formatDistance";
import { useImageUrl } from "hooks/useImageUrl";
import { makeUnitName } from "lib/utils";
import { useTranslations } from "next-intl";
import type { OfficerLogWithOfficer } from "src/pages/officer/my-officer-logs";
import type { EmsFdDeputy, Officer, OfficerLog } from "@snailycad/types";
import type { OfficerLogWithDeputy } from "src/pages/ems-fd/my-deputy-logs";

type Props =
  | {
      unit?: never;
      logs: OfficerLogWithOfficer[] | OfficerLogWithDeputy[];
    }
  | {
      unit: Officer | EmsFdDeputy | null;
      logs: OfficerLog[];
    };

export function OfficerLogsTable({ unit, logs }: Props) {
  const { makeImageUrl } = useImageUrl();
  const t = useTranslations("Leo");

  return (
    <Table
      data={logs.map((log) => {
        const startedAt = <FullDate>{log.startedAt}</FullDate>;
        const endedAt = log.endedAt ? <FullDate>{log.endedAt}</FullDate> : t("notEndedYet");
        const logUnit = getUnitFromLog(log) ?? unit;

        const totalTime =
          log.endedAt !== null
            ? `${formatDistance(new Date(log.endedAt), new Date(log.startedAt))}`
            : t("notEndedYet");

        if (!logUnit) return {};

        return {
          unit: (
            <span className="flex items-center">
              {logUnit.imageId ? (
                <img
                  className="rounded-md w-[30px] h-[30px] object-cover mr-2"
                  draggable={false}
                  src={makeImageUrl("units", logUnit.imageId)}
                />
              ) : null}
              {makeUnitName(logUnit)}
            </span>
          ),
          startedAt,
          endedAt,
          totalTime,
        };
      })}
      columns={[
        { Header: t("unit"), accessor: "unit" },
        { Header: t("startedAt"), accessor: "startedAt" },
        { Header: t("endedAt"), accessor: "endedAt" },
        { Header: t("totalTime"), accessor: "totalTime" },
      ]}
    />
  );
}

function getUnitFromLog(log: OfficerLog | OfficerLogWithDeputy | OfficerLogWithOfficer) {
  if ("officer" in log) return log.officer;
  if ("emsFdDeputy" in log) return log.emsFdDeputy;
  return null;
}
