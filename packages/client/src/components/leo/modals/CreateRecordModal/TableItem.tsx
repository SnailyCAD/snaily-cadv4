import * as React from "react";
import { PenalCode } from "types/prisma";
import { TableForm } from "./TableForm";

export const TableItem = ({ penalCode }: { penalCode: PenalCode }) => {
  return (
    <tr className="border-b-[1px] border-blue-50">
      <td>{penalCode.title}</td>
      <td>
        <TableForm penalCode={penalCode} />
      </td>
    </tr>
  );
};
