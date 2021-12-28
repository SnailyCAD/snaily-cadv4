import { Table } from "components/table/Table";
import { useFormikContext } from "formik";
import { PenalCode } from "types/prisma";
import { TableItemForm } from "./TableItemForm";

interface Props {
  penalCodes: PenalCode[];
}

export function PenalCodesTable({ penalCodes }: Props) {
  const { values } = useFormikContext<any>();

  if (penalCodes.length <= 0) {
    return <p className="mb-3">No penal codes selected.</p>;
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
          {
            accessor: "title",
            Header: "Penal Code",
          },
          {
            accessor: "data",
            Header: "Data",
          },
        ]}
      />
      <p className="flex items-center justify-center w-full gap-2 p-2 px-3">
        <span className="mr-2 font-semibold uppercase select-none">TOTAL </span>

        <span className="ml-2">
          <span className="font-semibold select-none">Fines: </span> ${totalFines || 0}
        </span>
        <span>{"/"}</span>
        <span className="ml-2">
          <span className="font-semibold select-none">Jail Time: </span>
          {totalJailTime || 0}
        </span>
        <span>{"/"}</span>
        <span className="ml-2">
          <span className="font-semibold select-none">Bail: </span> ${totalBail || 0}
        </span>
      </p>
    </div>
  );
}
