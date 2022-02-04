import { FullDate } from "components/shared/FullDate";
import { Table } from "components/shared/Table";
import formatDistance from "date-fns/formatDistance";
import { useImageUrl } from "hooks/useImageUrl";
import { makeUnitName } from "lib/utils";
import { useTranslations } from "next-intl";
import type { OfficerLogWithOfficer } from "src/pages/officer/my-officer-logs";
import type { Officer, OfficerLog } from "@snailycad/types";

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
        const startedAt = <FullDate>{log.startedAt}</FullDate>;
        const endedAt = log.endedAt ? <FullDate>{log.endedAt}</FullDate> : t("notEndedYet");
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
