import * as React from "react";
import { useRouter } from "next/router";
import { ChevronDown } from "react-bootstrap-icons";
import { useFeatureEnabled } from "hooks/useFeatureEnabled";
import type { Feature } from "@snailycad/types";
import { useTranslations } from "next-intl";
import { Dropdown } from "components/Dropdown";
import { Button } from "components/Button";
import { classNames } from "lib/classNames";

export function CitizenDropdown() {
  const enabled = useFeatureEnabled();
  const router = useRouter();
  const isActive = (route: string) => router.pathname.startsWith(route);
  const t = useTranslations("Nav");

  const items = [
    { name: t("citizens"), href: "/citizens" },
    { name: t("taxi"), href: "/taxi" },
    { name: t("bleeter"), href: "/bleeter" },
    { name: t("truckLogs"), href: "/truck-logs" },
    { name: t("business"), href: "/business" },
  ];

  return (
    <Dropdown
      trigger={
        <Button
          className={classNames(isActive("/citizen") && "font-semibold")}
          variant="transparent"
        >
          {t("citizen")}
          <span className="mt-1 ml-1">
            <ChevronDown width={15} height={15} className="text-gray-700 dark:text-gray-300" />
          </span>
        </Button>
      }
    >
      <Dropdown.LinkItem href="/citizen">{t("citizens")}</Dropdown.LinkItem>

      {items.map((item) => {
        const upperCase = item.href.replace("-", "_").replace("/", "").toUpperCase() as Feature;

        if (!enabled[upperCase]) {
          return null;
        }

        return (
          <Dropdown.LinkItem key={item.href} href={item.href}>
            {item.name}
          </Dropdown.LinkItem>
        );
      })}
    </Dropdown>
  );
}
