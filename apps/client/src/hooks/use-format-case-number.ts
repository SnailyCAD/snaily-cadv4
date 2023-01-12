import { useAuth } from "context/AuthContext";
import { formatCaseNumber, type _Record } from "@snailycad/utils/case-number";

export function useFormatCaseNumber() {
  const { cad } = useAuth();
  const miscCadSettings = cad?.miscCadSettings;

  function _formatCaseNumber(record: _Record | null) {
    if (!record) return "";
    return formatCaseNumber(record, miscCadSettings?.caseNumberTemplate ?? null);
  }

  return { formatCaseNumber: _formatCaseNumber };
}
