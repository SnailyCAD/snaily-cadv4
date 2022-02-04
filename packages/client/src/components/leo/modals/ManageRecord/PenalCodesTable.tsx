import { Table } from "components/shared/Table";
import { useFormikContext } from "formik";
import { useTranslations } from "next-intl";
import type { PenalCode } from "@snailycad/types";
import { TableItemForm } from "./TableItemForm";

interface Props {
  penalCodes: PenalCode[];
}

export function PenalCodesTable({ penalCodes }: Props) {
  const { values } = useFormikContext<any>();
  const t = useTranslations("Leo");

  if (penalCodes.length <= 0) {
    return <p className="mb-3">{t("noPenalCodesSelected")}</p>;
  }

  const totalFines = (values.violations as any[]).reduce(
    (ac, cv) => ac + (parseInt(cv.value.fine?.value) || 0),
    0,
  );

  const totalJailTime = (values.violations as any[]).reduce(
    (ac, cv) => ac + (parseInt(cv.value.jailTime?.value) || 0),
    0,
  );

  const totalBail = (values.violations as any[]).reduce(
    (ac, cv) => ac + (parseInt(cv.value.bail?.value) || 0),
    0,
  );

  return (
    <div className="w-full my-3 overflow-x-auto">
      <Table
        data={penalCodes.map((penalCode) => ({
          title: penalCode.title,
          data: <TableItemForm penalCode={penalCode} />,
        }))}
        columns={[
          { accessor: "title", Header: t("penalCode") },
          { accessor: "data", Header: "Data" },
        ]}
      />
      <p className="flex items-center justify-center w-full gap-2 p-2 px-3">
        <span className="mr-2 font-semibold uppercase select-none">
          {t("total").toUpperCase()}{" "}
        </span>

        <span className="ml-2">
          <span className="font-semibold select-none">{t("fines")}: </span> ${totalFines || 0}
        </span>
        <span>{"/"}</span>
        <span className="ml-2">
          <span className="font-semibold select-none">{t("jailTime")}: </span>
          {totalJailTime || 0}
        </span>
        <span>{"/"}</span>
        <span className="ml-2">
          <span className="font-semibold select-none">{t("bail")}: </span> ${totalBail || 0}
        </span>
      </p>
    </div>
  );
}
