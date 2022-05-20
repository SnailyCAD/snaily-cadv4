import { ThreeDots } from "react-bootstrap-icons";
import { useTranslations } from "next-intl";
import { Button } from "components/Button";
import { ModalIds } from "types/ModalIds";
import { useModal } from "state/modalState";
import { useDownload } from "@casper124578/useful";
import { Dropdown } from "components/Dropdown";
import { PenalCode, ValueType } from "@snailycad/types";
import { AnyValue, isDivisionValue, isStatusValue } from "@snailycad/utils";
import format from "date-fns/format";
import { parseAsync } from "json2csv";

interface Props {
  type: ValueType;
  values: (AnyValue | PenalCode)[];
}

export function OptionsDropdown({ type, values }: Props) {
  const t = useTranslations("Values");
  const { openModal } = useModal();
  const download = useDownload();

  async function handleExport(type: "csv" | "json") {
    const date = format(Date.now(), "yyyy-MM-dd-hh-ss-mm");
    const filename = `${type.toLowerCase()}_${date}.${type}`;
    const valuesData = omitUnnecessaryProperties([...values]);

    if (type === "json") {
      download({
        filename,
        data: JSON.stringify(valuesData, null, 4),
      });
    } else {
      const data = await parseAsync(valuesData, { escapedQuote: "'", quote: "'" });

      download({
        filename,
        data,
      });
    }
  }

  return (
    <Dropdown
      alignOffset={0}
      align="end"
      className="dropdown-right min-w-[200px]"
      trigger={
        <Button className="flex items-center justify-center w-8 h-8">
          <ThreeDots width={15} height={15} className="text-gray-300" />
        </Button>
      }
    >
      <Dropdown.Item onClick={() => openModal(ModalIds.ImportValues)}>
        {t("importValues")}
      </Dropdown.Item>
      <Dropdown.Item
        disabled={values.length <= 0 || type === ValueType.PENAL_CODE}
        onClick={() => handleExport("json")}
      >
        {t("exportValues")} (JSON)
      </Dropdown.Item>
      <Dropdown.Item
        disabled={values.length <= 0 || type === ValueType.PENAL_CODE}
        onClick={() => handleExport("csv")}
      >
        {t("exportValues")} (CSV)
      </Dropdown.Item>
    </Dropdown>
  );
}

function omitUnnecessaryProperties(values: readonly any[]) {
  return values.map((v) => {
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

    const value = { value: v.value.value, position: v.value.position };
    delete v.valueId;
    return { ...v, ...value };
  });
}
