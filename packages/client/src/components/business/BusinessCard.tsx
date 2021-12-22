import { Button } from "components/Button";
import Link from "next/link";
import { FullEmployee } from "state/businessState";
import { Business, whitelistStatus } from "types/prisma";
import { useTranslations } from "use-intl";

interface Props {
  employee: FullEmployee & { business: Business };
}

export function BusinessCard({ employee }: Props) {
  const common = useTranslations("Common");
  const t = useTranslations("Business");

  const isDisabled =
    employee.business.whitelisted && employee.whitelistStatus === whitelistStatus.PENDING;

  return (
    <li className="flex items-baseline justify-between p-4 rounded-md bg-gray-200/80">
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
          <span className="font-semibold">{t("role")}: </span> {employee.role?.value?.value}
        </p>
      </div>

      <Link href={`/business/${employee.businessId}/${employee.id}`}>
        <a>
          <Button title={isDisabled ? t("businessIsWhitelisted") : ""} disabled={isDisabled}>
            {common("view")}
          </Button>
        </a>
      </Link>
    </li>
  );
}
