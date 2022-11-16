import { ValueType } from "@snailycad/types";
import { ManageOfficerFields } from "components/leo/manage-officer/manage-officer-fields";
import { useLoadValuesClientSide } from "hooks/useLoadValuesClientSide";

export function CreateOfficerStep() {
  useLoadValuesClientSide({
    valueTypes: [ValueType.DEPARTMENT, ValueType.DIVISION],
  });

  return <ManageOfficerFields hideCitizenField />;
}
