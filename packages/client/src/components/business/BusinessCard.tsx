import { Button } from "components/Button";
import Link from "next/link";
import { FullEmployee } from "state/businessState";
import { Business } from "types/prisma";
import { useTranslations } from "use-intl";

interface Props {
  employee: FullEmployee & { business: Business };
}

export const BusinessCard = ({ employee }: Props) => {
  const common = useTranslations("Common");
  const t = useTranslations("Business");

  return (
    <li className="flex items-baseline justify-between bg-gray-200/80 p-4 rounded-md">
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
          <Button>{common("view")}</Button>
        </a>
      </Link>
    </li>
  );
};
