import type { Warrant } from "@snailycad/types";
import type { _Record } from "@snailycad/utils/case-number";
import { useFormatCaseNumber } from "hooks/use-format-case-number";

interface RecordsCaseNumberColumnProps {
  record: _Record | Warrant;
}

export function RecordsCaseNumberColumn(props: RecordsCaseNumberColumnProps) {
  const { formatCaseNumber } = useFormatCaseNumber();
  return <>{formatCaseNumber(props.record)}</>;
}
