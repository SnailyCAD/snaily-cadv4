import * as React from "react";
import { Select, SelectValue } from "components/form/Select";
import type { PenalCode, PenalCodeGroup } from "@snailycad/types";
import { FormRow } from "components/form/FormRow";
import { usePenalCodeGroups } from "hooks/values/use-penal-code-groups";

interface Props {
  value: SelectValue<PenalCode>[];
  penalCodes: PenalCode[];
  handleChange: any;
  isReadOnly?: boolean;
}

const ungroupedGroup = {
  id: "ungrouped",
  name: "Ungrouped",
} as PenalCodeGroup;

const allPenalCodesGroup = {
  id: "all",
  name: "All",
} as PenalCodeGroup;

export function SelectPenalCode({ value, handleChange, penalCodes, isReadOnly }: Props) {
  const [currentGroup, setCurrentGroup] = React.useState<string | null>("all");
  const { groups: penalCodeGroups } = usePenalCodeGroups();

  const groups = [allPenalCodesGroup, ungroupedGroup, ...penalCodeGroups];
  const [codes, setCodes] = React.useState<PenalCode[]>(penalCodes);

  function onGroupChange(e: { target: { value: string } }) {
    if (isReadOnly) return;
    const group = e.target.value;

    setCurrentGroup(e.target.value);

    if (group === "all") {
      setCodes(penalCodes);
    } else {
      setCodes(penalCodes.filter((v) => (v.groupId || "ungrouped") === group));
    }
  }

  return (
    <FormRow flexLike>
      <Select
        disabled={isReadOnly}
        className="w-[200px]"
        onChange={onGroupChange}
        value={currentGroup}
        name="group"
        values={groups.map((value) => ({
          label: value.name,
          value: value.id,
        }))}
      />
      <Select
        disabled={isReadOnly}
        className="w-full"
        extra={{ showPenalCodeDescriptions: true }}
        value={value}
        name="violations"
        onChange={handleChange}
        isMulti
        values={codes
          .filter((v) => !value.some((vio) => vio.value?.id === v.id))
          .map((value) => ({
            label: value.title,
            value,
          }))}
      />
    </FormRow>
  );
}
