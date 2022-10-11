import { EmsFdDeputy, Officer, QualificationValueType, UnitQualification } from "@snailycad/types";
import { QualificationsHoverCard } from "components/admin/manage/units/QualificationHoverCard";
import { FullDate } from "components/shared/FullDate";
import { Table, useTableState } from "components/shared/Table";
import { classNames } from "lib/classNames";
import { useTranslations } from "next-intl";

interface Props {
  unit: (EmsFdDeputy | Officer) & { qualifications?: UnitQualification[] };
}

export function UnitQualificationsTable({ unit }: Props) {
  const t = useTranslations("Leo");

  const awards =
    unit.qualifications?.filter(
      (v) => v.qualification.qualificationType === QualificationValueType.AWARD,
    ) ?? [];

  const qualifications =
    unit.qualifications?.filter(
      (v) => v.qualification.qualificationType === QualificationValueType.QUALIFICATION,
    ) ?? [];

  return (
    <div className="mt-3">
      <div id="qualifications">
        <h2 className="text-xl font-semibold">{t("unitQualifications")}</h2>

        {!qualifications.length ? (
          <p className="my-2 text-neutral-700 dark:text-gray-400">{t("noQualifications")}</p>
        ) : (
          <QualificationAwardsTable data={qualifications} />
        )}
      </div>

      <div id="awards">
        <h2 className="text-xl font-semibold">{t("unitAwards")}</h2>

        {!awards.length ? (
          <p className="my-2 text-neutral-700 dark:text-gray-400">{t("noAwards")}</p>
        ) : (
          <QualificationAwardsTable data={awards} />
        )}
      </div>
    </div>
  );
}

function QualificationAwardsTable({ data }: { data: UnitQualification[] }) {
  const common = useTranslations("Common");
  const t = useTranslations("Leo");
  const tableState = useTableState();

  return (
    <Table
      tableState={tableState}
      data={data.map((qa) => {
        return {
          id: qa.id,
          image: <QualificationsHoverCard qualification={qa} />,
          name: (
            <p className="flex flex-col">
              <span
                className={classNames(
                  qa.suspendedAt && "text-neutral-700 dark:text-gray-400 line-through",
                )}
              >
                {qa.qualification.value.value}
              </span>
              {qa.suspendedAt ? (
                <span>
                  {t("suspendedOn")} <FullDate>{qa.suspendedAt}</FullDate>
                </span>
              ) : null}
            </p>
          ),
          assignedAt: <FullDate>{qa.createdAt}</FullDate>,
        };
      })}
      columns={[
        { header: common("image"), accessorKey: "image" },
        { header: common("name"), accessorKey: "name" },
        { header: t("assignedAt"), accessorKey: "assignedAt" },
      ]}
    />
  );
}
