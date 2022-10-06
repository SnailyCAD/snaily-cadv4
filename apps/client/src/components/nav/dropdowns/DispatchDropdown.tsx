import { useRouter } from "next/router";
import { ChevronDown } from "react-bootstrap-icons";
import { useTranslations } from "next-intl";
import { Dropdown } from "components/Dropdown";
import { Button } from "@snailycad/ui";
import { classNames } from "lib/classNames";
import { usePermission, Permissions } from "hooks/usePermission";

export function DispatchDropdown() {
  const router = useRouter();
  const t = useTranslations("Nav");
  const isActive = (route: string) => router.pathname.startsWith(route);
  const { hasPermissions } = usePermission();

  return (
    <Dropdown
      trigger={
        <Button
          role="listitem"
          className={classNames(isActive("/dispatch") && "font-semibold")}
          variant="transparent"
        >
          {t("dispatch")}
          <span className="mt-1 ml-1">
            <ChevronDown width={15} height={15} className="text-gray-700 dark:text-gray-300" />
          </span>
        </Button>
      }
    >
      {hasPermissions([Permissions.Dispatch], false) ? (
        <Dropdown.LinkItem href="/dispatch">{t("dashboard")}</Dropdown.LinkItem>
      ) : null}

      {hasPermissions([Permissions.LiveMap], true) ? (
        <Dropdown.LinkItem href="/dispatch/map">{t("liveMap")}</Dropdown.LinkItem>
      ) : null}
    </Dropdown>
  );
}
