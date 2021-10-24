import compareDesc from "date-fns/compareDesc";
import format from "date-fns/format";
import { Officer, PenalCode, Record, RecordType } from "types/prisma";
import { useTranslations } from "use-intl";

export type FullRecord = Record & { officer: Officer; violations: PenalCode[] };
interface Props {
  records: FullRecord[];
}

export const RecordsArea = ({ records }: Props) => {
  const t = useTranslations();

  const tickets = records.filter((v) => v.type === RecordType.TICKET);
  const writtenWarnings = records.filter((v) => v.type === RecordType.WRITTEN_WARNING);
  const arrestReports = records.filter((v) => v.type === RecordType.ARREST_REPORT);

  const data: [string, string, FullRecord[]][] = [
    [t("Leo.tickets"), t("Leo.noTicketsCitizen"), tickets],
    [t("Leo.writtenWarnings"), t("Leo.noWrittenWarnings"), writtenWarnings],
    [t("Leo.arrestReports"), t("Leo.noArrestReports"), arrestReports],
  ];

  return (
    <>
      {data.map(([title, noValuesText, data]) => (
        <section className="my-2 mb-5" key={title} id={title}>
          <h3 className="text-xl font-semibold">{title}</h3>

          {data!.length <= 0 ? <p>{noValuesText}</p> : <Table data={data} />}
        </section>
      ))}
    </>
  );
};

const Table = ({ data }: { data: FullRecord[] }) => {
  const common = useTranslations("Common");
  const t = useTranslations();

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
            <th>{common("actions")}</th>
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
                <td>{"TODO"}</td>
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  );
};
