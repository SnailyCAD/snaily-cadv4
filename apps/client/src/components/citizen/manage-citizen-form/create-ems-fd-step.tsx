import { ValueType } from "@snailycad/types";
import { MultiFormStep } from "@snailycad/ui";
import { useLoadValuesClientSide } from "hooks/useLoadValuesClientSide";

export function CreateEmsFdStep() {
  useLoadValuesClientSide({
    valueTypes: [ValueType.DEPARTMENT, ValueType.DIVISION],
  });

  /* todo:
            - load translations
          */

  return <MultiFormStep>{() => <p>todo</p>}</MultiFormStep>;
}
