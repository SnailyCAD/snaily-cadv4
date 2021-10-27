import compareDesc from "date-fns/compareDesc";
import format from "date-fns/format";
import { useRouter } from "next/router";
import { Officer, PenalCode, Record, RecordType } from "types/prisma";
import { useTranslations } from "use-intl";

export type FullRecord = Record & { officer: Officer; violations: PenalCode[] };
interface Props {
  records: FullRecord[];
}

export const RecordsArea = ({ records }: Props) => {
  const t = useTranslations();
  const router = useRouter();
  const isCitizen = router.pathname.startsWith("/citizen");

  const tickets = records.filter((v) => v.type === RecordType.TICKET);
  const writtenWarnings = records.filter((v) => v.type === RecordType.WRITTEN_WARNING);
  const arrestReports = records.filter((v) => v.type === RecordType.ARREST_REPORT);

  const data: [string, string, FullRecord[]][] = [
    [t("Leo.tickets"), t("Leo.noTicketsCitizen"), tickets],
    [t("Leo.writtenWarnings"), t("Leo.noWrittenWarnings"), writtenWarnings],
    [t("Leo.arrestReports"), t("Leo.noArrestReports"), arrestReports],
  ];

  return (
    <div className={isCitizen ? "bg-gray-200/60 p-4 rounded-md" : ""}>
      {isCitizen ? (
        <header className="flex items-center justify-between mb-3">
          <h1 className="text-2xl font-semibold">{t("Leo.records")}</h1>
        </header>
      ) : null}

      {data.map(([title, noValuesText, data]) => (
        <section className="my-2 mb-5" key={title} id={title}>
          <h3 className="text-xl font-semibold">{title}</h3>

          {data!.length <= 0 ? <p>{noValuesText}</p> : <Table data={data} />}
        </section>
      ))}
    </div>
  );
};

const Table = ({ data }: { data: FullRecord[] }) => {
  const common = useTranslations("Common");
  const t = useTranslations();
  const router = useRouter();
  const isCitizen = router.pathname.startsWith("/citizen");

  return (
    <div className="overflow-x-auto w-full mt-3 max-h-56">
      <table className="overflow-hidden w-full whitespace-nowrap">
        <thead className="sticky top-0">
          <tr>
            <th>{t("Leo.violations")}</th>
            <th>{t("Leo.postal")}</th>
            <th>{t("Leo.officer")}</th>
            <th>{common("description")}</th>
            <th>{common("createdAt")}</th>
            {isCitizen ? null : <th>{common("actions")}</th>}
          </tr>
        </thead>
        <tbody>
          {data
            .sort((a, b) => compareDesc(new Date(a.createdAt), new Date(b.createdAt)))
            .map((value) => (
              <tr key={value.id}>
                <td>{value.violations.map((v) => v.title).join(", ")}</td>
                <td>{value.postal}</td>
                <td>
                  {value.officer.callsign} {value.officer.name}
                </td>
                <td>{value.notes}</td>
                <td>{format(new Date(value.createdAt), "yyyy-MM-dd")}</td>
                {isCitizen ? null : <td>{"TODO"}</td>}
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  );
};
