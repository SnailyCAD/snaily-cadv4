import { ValueType } from "@snailycad/types";
import { useLoadValuesClientSide } from "hooks/useLoadValuesClientSide";

export function CreatePreviousRecordsStep() {
  useLoadValuesClientSide({
    valueTypes: [ValueType.PENAL_CODE],
  });

  return "test";
}
