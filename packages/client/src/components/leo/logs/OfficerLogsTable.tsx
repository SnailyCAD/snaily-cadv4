import { Table } from "components/shared/Table";
import formatDistance from "date-fns/formatDistance";
import { useImageUrl } from "hooks/useImageUrl";
import { formatDate, makeUnitName } from "lib/utils";
import { useTranslations } from "next-intl";
import { OfficerLogWithOfficer } from "src/pages/officer/my-officer-logs";
import { Officer, OfficerLog } from "types/prisma";

type Props =
  | {
      officer?: never;
      logs: OfficerLogWithOfficer[];
    }
  | {
      officer: Officer;
      logs: OfficerLog[];
    };

export function OfficerLogsTable({ officer, logs }: Props) {
  const { makeImageUrl } = useImageUrl();
  const t = useTranslations("Leo");

  return (
    <Table
      data={logs.map((log) => {
        const startedAt = formatDate(log.startedAt);
        const endedAt = log.endedAt ? formatDate(log.endedAt) : t("notEndedYet");
        const logOfficer = "officer" in log ? log.officer : (officer as Officer);

        const totalTime =
          log.endedAt !== null
            ? `${formatDistance(new Date(log.endedAt), new Date(log.startedAt))}`
            : t("notEndedYet");

        return {
          officer: (
            <span className="flex items-center">
              {logOfficer.imageId ? (
                <img
                  className="rounded-md w-[30px] h-[30px] object-cover mr-2"
                  draggable={false}
                  src={makeImageUrl("units", logOfficer.imageId)}
                />
              ) : null}
              {makeUnitName(logOfficer)}
            </span>
          ),
          startedAt,
          endedAt,
          totalTime,
        };
      })}
      columns={[
        { Header: t("officer"), accessor: "officer" },
        { Header: t("startedAt"), accessor: "startedAt" },
        { Header: t("endedAt"), accessor: "endedAt" },
        { Header: t("totalTime"), accessor: "totalTime" },
      ]}
    />
  );
}
