import * as React from "react";
import { useRouter } from "next/router";
import { ChevronDown } from "react-bootstrap-icons";
import { useTranslations } from "next-intl";
import { Dropdown } from "components/Dropdown";
import { Button } from "components/Button";
import { classNames } from "lib/classNames";

export function TowDropdown() {
  const router = useRouter();
  const t = useTranslations("Nav");
  const isActive = (route: string) => router.pathname.startsWith(route);

  return (
    <Dropdown
      trigger={
        <Button className={classNames(isActive("/tow") && "font-semibold")} variant="transparent">
          {t("tow")}
          <span className="mt-1 ml-1">
            <ChevronDown width={15} height={15} className="text-gray-700 dark:text-gray-300" />
          </span>
        </Button>
      }
    >
      <Dropdown.LinkItem href="/tow">{t("dashboard")}</Dropdown.LinkItem>
      <Dropdown.LinkItem href="/tow/logs">{t("towLogs")}</Dropdown.LinkItem>
    </Dropdown>
  );
}
