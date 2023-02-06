import { Button } from "@snailycad/ui";
import { useAuth } from "context/AuthContext";
import Link from "next/link";
import { WhitelistStatus } from "@snailycad/types";
import { useTranslations } from "use-intl";
import type { GetBusinessesData } from "@snailycad/types/api";

interface Props {
  employee: GetBusinessesData["businesses"][number];
}

export function BusinessCard({ employee }: Props) {
  const common = useTranslations("Common");
  const t = useTranslations("Business");
  const { cad } = useAuth();

  const businessWhitelisted = cad?.businessWhitelisted ?? false;

  /** button is disabled due to the business awaiting approval from an admin */
  const isDisabledDueToPending =
    businessWhitelisted && employee.business.status === WhitelistStatus.PENDING;

  /** button is disabled due to the employee awaiting approval from the business owner */
  const isDisabledDueToEmployeePending = employee.whitelistStatus === WhitelistStatus.PENDING;

  const isDisabled = isDisabledDueToPending || isDisabledDueToEmployeePending;
  const disabledMessage = isDisabledDueToEmployeePending
    ? t("businessIsWhitelisted")
    : t("businessWhitelistedCAD");

  return (
    <li className="flex items-baseline justify-between p-4 rounded-md card shadow-sm dark:shadow-md border border-gray-400 dark:border-quinary dark:bg-tertiary">
      <div>
        <p>
          <span className="font-semibold">{t("business")}: </span> {employee.business.name}
        </p>
        <p>
          <span className="font-semibold">{t("citizen")}: </span>
          <span>
            {employee.citizen.name} {employee.citizen.surname}
          </span>
        </p>
        <p>
          <span className="font-semibold">{t("role")}: </span> {employee.role?.value.value}
        </p>
      </div>

      <Link href={isDisabled ? "#" : `/business/${employee.businessId}/${employee.id}`}>
        <Button title={disabledMessage} disabled={isDisabled}>
          {common("view")}
        </Button>
      </Link>
    </li>
  );
}
