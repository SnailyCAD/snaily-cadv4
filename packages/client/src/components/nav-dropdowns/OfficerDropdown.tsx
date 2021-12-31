import * as React from "react";
import { useRouter } from "next/router";
import { ChevronDown } from "react-bootstrap-icons";
import { useAuth } from "context/AuthContext";
import { useTranslations } from "next-intl";
import { Dropdown } from "components/Dropdown";
import { Button } from "components/Button";
import { classNames } from "lib/classNames";

export function OfficerDropdown() {
  const router = useRouter();
  const t = useTranslations("Nav");
  const isActive = (route: string) => router.pathname.startsWith(route);
  const { user } = useAuth();

  const items = [
    { name: t("myOfficers"), href: "/my-officers" },
    { name: t("myOfficerLogs"), href: "/my-officer-logs" },
    { name: t("incidents"), href: "/incidents" },
    { name: t("impoundLot"), href: "/impound-lot" },
    { name: t("jail"), href: "/jail" },
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
        const path = item.href;

        return (
          <Dropdown.LinkItem key={path} href={`/officer${path}`}>
            {item.name}
          </Dropdown.LinkItem>
        );
      })}

      {user?.isSupervisor ? (
        <>
          <Dropdown.LinkItem href="/admin/manage/units">{t("manageUnits")}</Dropdown.LinkItem>
          <Dropdown.LinkItem href="/officer/supervisor/citizen-logs">
            {t("citizenLogs")}
          </Dropdown.LinkItem>
        </>
      ) : null}
    </Dropdown>
  );
}
