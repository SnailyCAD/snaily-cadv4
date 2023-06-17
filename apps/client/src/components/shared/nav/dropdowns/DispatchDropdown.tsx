import { useRouter } from "next/router";
import { ChevronDown } from "react-bootstrap-icons";
import { useTranslations } from "next-intl";
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLinkItem,
  DropdownMenuTrigger,
} from "@snailycad/ui";
import { classNames } from "lib/classNames";
import { usePermission, Permissions } from "hooks/usePermission";

export function DispatchDropdown() {
  const router = useRouter();
  const t = useTranslations("Nav");
  const isActive = (route: string) => router.pathname.startsWith(route);
  const { hasPermissions } = usePermission();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          role="listitem"
          className={classNames(
            "flex gap-1 items-center px-2",
            isActive("/dispatch") && "font-semibold",
          )}
          variant="transparent"
        >
          {t("dispatch")}
          <span className="mt-1 ml-1">
            <ChevronDown width={15} height={15} className="text-gray-700 dark:text-gray-300" />
          </span>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="start" alignOffset={10}>
        {hasPermissions([Permissions.Dispatch]) ? (
          <DropdownMenuLinkItem href="/dispatch">{t("dashboard")}</DropdownMenuLinkItem>
        ) : null}

        {hasPermissions([Permissions.LiveMap]) ? (
          <DropdownMenuLinkItem href="/dispatch/map">{t("liveMap")}</DropdownMenuLinkItem>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
