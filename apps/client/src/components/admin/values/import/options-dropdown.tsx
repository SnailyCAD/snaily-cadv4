import { ThreeDots } from "react-bootstrap-icons";
import { useTranslations } from "next-intl";
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@snailycad/ui";
import { ModalIds } from "types/modal-ids";
import { useModal } from "state/modalState";
import { useDownload } from "@casperiv/useful";
import type { ValueType } from "@snailycad/types";
import { isPenalCodeValue, isDivisionValue, isStatusValue } from "@snailycad/utils";
import format from "date-fns/format";
import { omit } from "lib/utils";
import useFetch from "lib/useFetch";
import type { GetValuesExportData } from "@snailycad/types/api";

interface Props {
  type: ValueType;
  valueLength: number;
}

export function OptionsDropdown({ type, valueLength }: Props) {
  const t = useTranslations("Values");
  const modalState = useModal();
  const download = useDownload();
  const { state, execute } = useFetch();

  async function handleExport() {
    const { json } = await execute<GetValuesExportData>({
      path: `/admin/values/${type.toLowerCase()}/export`,
    });

    const date = format(Date.now(), "yyyy-MM-dd-hh-ss-mm");
    download({
      filename: `${type.toLowerCase()}_${date}.json`,
      data: JSON.stringify(omitUnnecessaryProperties([...json]), null, 4),
    });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="xs" className="flex items-center justify-center w-9 h-9">
          <ThreeDots
            aria-label="Options"
            width={17}
            height={17}
            className="fill-neutral-800 dark:fill-gray-300"
          />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent alignOffset={0} align="end">
        <DropdownMenuItem onClick={() => modalState.openModal(ModalIds.ImportValues)}>
          {t("importValues")}
        </DropdownMenuItem>
        <DropdownMenuItem
          closeOnClick={false}
          disabled={state === "loading" || valueLength <= 0}
          onClick={handleExport}
        >
          {t("exportValues")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function omitUnnecessaryProperties(values: readonly any[]) {
  return [...values].map((v) => {
    delete v.id;

    if ("createdAt" in v && !isPenalCodeValue(v)) {
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
        warningApplicable: Boolean(v.warningApplicable),
        warningNotApplicable: Boolean(v.warningNotApplicable),
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
