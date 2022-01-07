import * as React from "react";
import { Select, SelectValue } from "components/form/Select";
import { PenalCode, PenalCodeGroup } from "types/prisma";
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

export function SelectPenalCode({ value, handleChange, penalCodes }: Props) {
  const { penalCodeGroups } = useValues();
  const [currentGroup, setCurrentGroup] = React.useState<SelectValue | null>(null);

  const groups = [ungroupedGroup, ...penalCodeGroups];
  const [codes, setCodes] = React.useState<PenalCode[]>([]);

  function onGroupChange(e: { target: { value: string } }) {
    const group = e.target;
    console.log({ group });

    setCurrentGroup(e.target);
    setCodes(penalCodes.filter((v) => (v.groupId || "ungrouped") === group));
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
          isMulti
          values={codes.map((value) => ({
            label: value.title,
            // value: "title" in value ? { ...value, type: "PN" } : { ...value, type: "PNG" },
            value,
          }))}
        />
      </FormRow>
    </>
  );
}
