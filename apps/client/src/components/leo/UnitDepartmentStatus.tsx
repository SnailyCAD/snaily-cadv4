import { EmsFdDeputy, Officer, WhitelistStatus } from "@snailycad/types";
import { Button } from "@snailycad/ui";
import { HoverCard } from "components/shared/HoverCard";
import { Status } from "components/shared/Status";
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
        <HoverCard
          trigger={
            <Button className="px-1 cursor-default">
              <Info />
            </Button>
          }
        >
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
        </HoverCard>
      ) : null}
    </span>
  );
}
