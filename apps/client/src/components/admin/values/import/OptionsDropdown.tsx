import { ThreeDots } from "react-bootstrap-icons";
import { useTranslations } from "next-intl";
import { Button } from "@snailycad/ui";
import { ModalIds } from "types/ModalIds";
import { useModal } from "state/modalState";
import { useDownload } from "@casper124578/useful";
import { Dropdown } from "components/Dropdown";
import type { PenalCode, ValueType, AnyValue } from "@snailycad/types";
import { isPenalCodeValue, isDivisionValue, isStatusValue } from "@snailycad/utils";
import format from "date-fns/format";
import { omit } from "lib/utils";

interface Props {
  type: ValueType;
  values: (AnyValue | PenalCode)[];
}

export function OptionsDropdown({ type, values }: Props) {
  const t = useTranslations("Values");
  const { openModal } = useModal();
  const download = useDownload();

  function handleExport() {
    const date = format(Date.now(), "yyyy-MM-dd-hh-ss-mm");
    download({
      filename: `${type.toLowerCase()}_${date}.json`,
      data: JSON.stringify(omitUnnecessaryProperties([...values]), null, 4),
    });
  }

  return (
    <Dropdown
      alignOffset={0}
      align="end"
      className="dropdown-right"
      trigger={
        <Button className="flex items-center justify-center w-8 h-8">
          <ThreeDots
            aria-label="Options"
            width={15}
            height={15}
            className="text-neutral-800 dark:text-gray-300"
          />
        </Button>
      }
    >
      <Dropdown.Item onPress={() => openModal(ModalIds.ImportValues)}>
        {t("importValues")}
      </Dropdown.Item>
      <Dropdown.Item disabled={values.length <= 0} onPress={handleExport}>
        {t("exportValues")}
      </Dropdown.Item>
    </Dropdown>
  );
}

function omitUnnecessaryProperties(values: readonly any[]) {
  return [...values].map((v) => {
    delete v.id;

    if ("createdAt" in v) {
      delete v.createdAt;
      delete v.updatedAt;
      delete v.type;

      return v;
    }

    if (isStatusValue(v)) {
      (v.departments as any) = v.departments?.map((v) => v.id) ?? [];
    }

    if (isDivisionValue(v)) {
      delete (v as any).department;
    }

    if (isPenalCodeValue(v)) {
      return {
        ...omit(v, ["createdAt", "updatedAt", "position", "warningApplicable"]),
        warningApplicable: !!v.warningApplicable,
        warningNotApplicable: !!v.warningNotApplicable,
        warningFines: v.warningApplicable ? v.warningApplicable.fines : [],
        warningNotFines: v.warningNotApplicable ? v.warningNotApplicable.fines : [],
        prisonTerm: v.warningNotApplicable ? v.warningNotApplicable.prisonTerm : [],
        bail: v.warningNotApplicable ? v.warningNotApplicable.bail : [],
      };
    }

    const value = { value: v.value.value, position: v.value.position };
    delete v.valueId;
    return { ...v, ...value };
  });
}
