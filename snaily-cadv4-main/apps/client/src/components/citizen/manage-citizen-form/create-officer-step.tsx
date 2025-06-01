import * as React from "react";
import { ValueType } from "@snailycad/types";
import { ManageOfficerFields } from "components/leo/manage-officer/manage-officer-fields";
import { useLoadValuesClientSide } from "hooks/useLoadValuesClientSide";

let valuesFetched = false;

export function CreateOfficerStep() {
  useLoadValuesClientSide({
    valueTypes: [ValueType.DEPARTMENT, ValueType.DIVISION],
    enabled: !valuesFetched,
  });

  React.useEffect(() => {
    valuesFetched = true;
  }, []);

  return <ManageOfficerFields hideCitizenField />;
}
