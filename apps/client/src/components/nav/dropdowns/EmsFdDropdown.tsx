import { useRouter } from "next/router";
import { ChevronDown } from "react-bootstrap-icons";
import { useTranslations } from "next-intl";
import { Dropdown } from "components/Dropdown";
import { Button } from "@snailycad/ui";
import { classNames } from "lib/classNames";

export function EmsFdDropdown() {
  const router = useRouter();
  const t = useTranslations("Nav");
  const isActive = (route: string) => router.pathname.startsWith(route);

  return (
    <Dropdown
      trigger={
        <Button
          role="listitem"
          className={classNames(isActive("/ems-fd") && "font-semibold")}
          variant="transparent"
        >
          {t("emsFd")}
          <span className="mt-1 ml-1">
            <ChevronDown width={15} height={15} className="text-gray-700 dark:text-gray-300" />
          </span>
        </Button>
      }
    >
      <Dropdown.LinkItem href="/ems-fd">{t("dashboard")}</Dropdown.LinkItem>
      <Dropdown.LinkItem href="/ems-fd/my-deputies">{t("myDeputies")}</Dropdown.LinkItem>
      <Dropdown.LinkItem href="/ems-fd/my-deputy-logs">{t("myDeputyLogs")}</Dropdown.LinkItem>
    </Dropdown>
  );
}
