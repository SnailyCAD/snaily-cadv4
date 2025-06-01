import { type EmsFdDeputy, type Officer, WhitelistStatus } from "@snailycad/types";
import { Button, HoverCard, HoverCardContent, HoverCardTrigger, Status } from "@snailycad/ui";
import { useTranslations } from "next-intl";
import { Info } from "react-bootstrap-icons";

interface Props {
  unit: EmsFdDeputy | Officer;
}

export function UnitDepartmentStatus({ unit }: Props) {
  const t = useTranslations("Leo");
  const departmentStatus = unit.whitelistStatus?.status ?? null;

  return (
    <span className="capitalize flex items-center gap-2">
      <Status fallback="—">{departmentStatus}</Status>

      {unit.whitelistStatus?.status === WhitelistStatus.PENDING ? (
        <HoverCard>
          <HoverCardTrigger asChild>
            <Button className="px-1 cursor-default">
              <Info />
            </Button>
          </HoverCardTrigger>

          <HoverCardContent pointerEvents>
            <p className="max-w-[400px]">
              {t(
                unit.department?.isDefaultDepartment
                  ? "pendingAccessDepartment"
                  : "pendingAccessDepartmentNoDefault",
                {
                  defaultDepartment: unit.department?.value.value,
                },
              )}
            </p>
          </HoverCardContent>
        </HoverCard>
      ) : null}
    </span>
  );
}
