import { ValueType } from "@snailycad/types";
import { MultiFormStep } from "@snailycad/ui";
import { useLoadValuesClientSide } from "hooks/useLoadValuesClientSide";

export function CreateEmsFdStep() {
  useLoadValuesClientSide({
    valueTypes: [ValueType.DEPARTMENT, ValueType.DIVISION],
  });

  return <MultiFormStep title="Create EMS/FD Deputy">{() => <p>todo</p>}</MultiFormStep>;
}
