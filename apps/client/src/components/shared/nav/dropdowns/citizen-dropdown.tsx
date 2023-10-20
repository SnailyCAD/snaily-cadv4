import { useRouter } from "next/router";
import { ChevronDown } from "react-bootstrap-icons";
import { useFeatureEnabled } from "hooks/useFeatureEnabled";
import { useTranslations } from "next-intl";
import {
  Button,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuLinkItem,
  DropdownMenuContent,
} from "@snailycad/ui";
import { classNames } from "lib/classNames";
import { useAuth } from "context/AuthContext";
import { usePermission, Permissions } from "hooks/usePermission";

export function CitizenDropdown() {
  const enabled = useFeatureEnabled();
  const router = useRouter();
  const isActive = (route: string) => router.pathname.startsWith(route);
  const t = useTranslations("Nav");
  const { user } = useAuth();
  const { hasPermissions } = usePermission();

  const items = [
    { name: t("citizens"), href: "/citizens" },
    {
      name: t("taxi"),
      href: "/taxi",
      show:
        enabled.TAXI && hasPermissions([Permissions.ViewTaxiCalls, Permissions.ManageTaxiCalls]),
    },
    { name: t("bleeter"), href: "/bleeter", show: enabled.BLEETER },
    { name: t("truckLogs"), href: "/truck-logs", show: enabled.TRUCK_LOGS },
    { name: t("business"), href: "/business", show: enabled.BUSINESS },
    {
      name: t("pets"),
      href: "/pets",
      show: enabled.PETS,
    },
    {
      name: t("lawBook"),
      href: "/law-book",
      show: enabled.OPEN_LAW_BOOK,
    },
  ];

  if (!user) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          role="listitem"
          className={classNames(
            "flex gap-1 items-center px-2",
            isActive("/citizen") && "font-semibold",
          )}
          variant="transparent"
        >
          {t("citizen")}
          <span className="mt-1 ml-1">
            <ChevronDown width={15} height={15} className="text-gray-700 dark:text-gray-300" />
          </span>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="start" alignOffset={10}>
        <DropdownMenuLinkItem href="/citizen">{t("citizens")}</DropdownMenuLinkItem>

        {items.map((item) => {
          if (!item.show) {
            return null;
          }

          return (
            <DropdownMenuLinkItem key={item.href} href={item.href}>
              {item.name}
            </DropdownMenuLinkItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
