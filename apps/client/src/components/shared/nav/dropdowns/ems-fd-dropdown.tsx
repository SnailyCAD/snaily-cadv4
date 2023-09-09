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
import { Permissions, usePermission } from "hooks/usePermission";

export function EmsFdDropdown() {
  const router = useRouter();
  const t = useTranslations("Nav");
  const isActive = (route: string) => router.pathname.startsWith(route);

  const { hasPermissions } = usePermission();
  const hasIncidentPermissions = hasPermissions([
    Permissions.ManageEmsFdIncidents,
    Permissions.ViewEmsFdIncidents,
  ]);
  const hasHospitalServicePermissions = hasPermissions([
    Permissions.ViewDeadCitizens,
    Permissions.ManageDeadCitizens,
  ]);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          role="listitem"
          className={classNames(
            "flex gap-1 items-center px-2",
            isActive("/ems-fd") && "font-semibold",
          )}
          variant="transparent"
        >
          {t("emsFd")}
          <span className="mt-1 ml-1">
            <ChevronDown width={15} height={15} className="text-gray-700 dark:text-gray-300" />
          </span>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent className="min-w-[200px]" align="start" alignOffset={10}>
        <DropdownMenuLinkItem href="/ems-fd">{t("dashboard")}</DropdownMenuLinkItem>
        <DropdownMenuLinkItem href="/ems-fd/my-deputies">{t("myDeputies")}</DropdownMenuLinkItem>
        <DropdownMenuLinkItem href="/ems-fd/my-deputy-logs">
          {t("myDeputyLogs")}
        </DropdownMenuLinkItem>
        {hasIncidentPermissions ? (
          <DropdownMenuLinkItem href="/ems-fd/incidents">
            {t("emsFdIncidents")}
          </DropdownMenuLinkItem>
        ) : null}
        {hasHospitalServicePermissions ? (
          <DropdownMenuLinkItem href="/ems-fd/hospital-services">
            {t("hospitalServices")}
          </DropdownMenuLinkItem>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
