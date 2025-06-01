import * as React from "react";
import { Select, type SelectValue } from "components/form/Select";
import type { PenalCode } from "@snailycad/types";
import { FormRow } from "@snailycad/ui";
import { usePenalCodeGroups } from "hooks/values/use-penal-code-groups";
import { parseCurrentValue } from "./table-item-form";
import { useTranslations } from "use-intl";

interface Props {
  value: SelectValue<PenalCode>[];
  penalCodes: PenalCode[];
  handleChange: any;
  isReadOnly?: boolean;
}

export function SelectPenalCode({ value, handleChange, penalCodes, isReadOnly }: Props) {
  const [currentGroup, setCurrentGroup] = React.useState<string | null>("all");
  const { groups: penalCodeGroups } = usePenalCodeGroups();
  const t = useTranslations("Leo");

  const groups = [
    { id: "ungrouped", name: t("ungrouped") },
    { id: "all", name: t("all") },
    ...penalCodeGroups,
  ];
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
    <FormRow useFlex>
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
            value: parseCurrentValue(value),
          }))}
      />
    </FormRow>
  );
}
