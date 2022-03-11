import { useRouter } from "next/router";
import { ChevronDown } from "react-bootstrap-icons";
import { useTranslations } from "next-intl";
import { Dropdown } from "components/Dropdown";
import { Button } from "components/Button";
import { classNames } from "lib/classNames";
import { usePermission, Permissions } from "hooks/usePermission";

export function OfficerDropdown() {
  const router = useRouter();
  const t = useTranslations("Nav");
  const isActive = (route: string) => router.pathname.startsWith(route);
  const { hasPermissions } = usePermission();

  const items = [
    { name: t("myOfficers"), href: "/my-officers" },
    { name: t("myOfficerLogs"), href: "/my-officer-logs" },
    {
      name: t("incidents"),
      href: "/incidents",
      show: hasPermissions([Permissions.ManageIncidents, Permissions.ViewIncidents], true),
    },
    {
      name: t("impoundLot"),
      href: "/impound-lot",
      show: hasPermissions([Permissions.ManageImpoundLot, Permissions.ViewImpoundLot], true),
    },
    {
      name: t("jail"),
      href: "/jail",
      show: hasPermissions([Permissions.ManageJail, Permissions.ViewJail], true),
    },
    {
      name: t("callHistory"),
      href: "/call-history",
      show: hasPermissions([Permissions.ViewCallHistory], true),
    },
    {
      name: t("manageUnits"),
      href: "/admin/manage/units",
      show: hasPermissions([Permissions.ManageUnits, Permissions.ViewUnits], (u) => u.isSupervisor),
    },
    {
      name: t("citizenLogs"),
      href: "/officer/supervisor/citizen-logs",
      // show: hasPermissions([Permissions.ManageUnits, Permissions.ViewUnits], (u) => u.isSupervisor),
    },
  ];

  return (
    <Dropdown
      trigger={
        <Button
          className={classNames(isActive("/officer") && "font-semibold")}
          variant="transparent"
        >
          {t("officer")}
          <span className="mt-1 ml-1">
            <ChevronDown width={15} height={15} className="text-gray-700 dark:text-gray-300" />
          </span>
        </Button>
      }
    >
      <Dropdown.LinkItem href="/officer">{t("dashboard")}</Dropdown.LinkItem>

      {items.map((item) => {
        const show = item.show ?? true;
        const path = item.href;

        if (!show) {
          return null;
        }

        return (
          <Dropdown.LinkItem key={path} href={`/officer${path}`}>
            {item.name}
          </Dropdown.LinkItem>
        );
      })}
    </Dropdown>
  );
}
