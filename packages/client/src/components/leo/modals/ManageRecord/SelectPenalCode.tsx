import * as React from "react";
import { Select, SelectValue } from "components/form/Select";
import type { PenalCode, PenalCodeGroup } from "@snailycad/types";
import { useValues } from "context/ValuesContext";
import { FormRow } from "components/form/FormRow";

interface Props {
  value: SelectValue<PenalCode>[];
  penalCodes: PenalCode[];
  handleChange: any;
}

const ungroupedGroup = {
  id: "ungrouped",
  name: "Ungrouped",
} as PenalCodeGroup;

const allPenalCodesGroup = {
  id: "all",
  name: "All",
} as PenalCodeGroup;

export function SelectPenalCode({ value, handleChange, penalCodes }: Props) {
  const { penalCodeGroups } = useValues();
  const [currentGroup, setCurrentGroup] = React.useState<string | null>("all");

  const groups = [allPenalCodesGroup, ungroupedGroup, ...penalCodeGroups];
  const [codes, setCodes] = React.useState<PenalCode[]>(penalCodes);

  function onGroupChange(e: { target: { value: string } }) {
    const group = e.target.value;

    setCurrentGroup(e.target.value);

    if (group === "all") {
      setCodes(penalCodes);
    } else {
      setCodes(penalCodes.filter((v) => (v.groupId || "ungrouped") === group));
    }
  }

  return (
    <>
      <FormRow flexLike>
        <Select
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
          className="w-full"
          extra={{ showPenalCodeDescriptions: true }}
          value={value}
          name="violations"
          onChange={handleChange}
          isMulti
          values={codes.map((value) => ({
            label: value.title,
            value,
          }))}
        />
      </FormRow>
    </>
  );
}
