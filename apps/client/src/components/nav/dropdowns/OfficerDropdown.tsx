import { useRouter } from "next/router";
import { ChevronDown } from "react-bootstrap-icons";
import { useTranslations } from "next-intl";
import { Dropdown } from "components/Dropdown";
import { Button } from "@snailycad/ui";
import { classNames } from "lib/classNames";
import { usePermission, Permissions } from "hooks/usePermission";
import { useFeatureEnabled } from "hooks/useFeatureEnabled";
import { useQuery } from "@tanstack/react-query";
import useFetch from "lib/useFetch";

export function OfficerDropdown() {
  const router = useRouter();
  const t = useTranslations("Nav");
  const isActive = (route: string) => router.pathname.startsWith(route);
  const { hasPermissions } = usePermission();
  const { LICENSE_EXAMS, CALLS_911, DMV, BUREAU_OF_FIREARMS } = useFeatureEnabled();
  const { execute } = useFetch();

  const { data, isLoading } = useQuery({
    queryKey: ["officer", "notifications"],
    queryFn: async () => {
      const { json } = await execute({ path: "/notifications/officer", noToast: true });
      return json as { pendingVehicles: number; pendingWeapons: number };
    },
  });

  const totalNotificationsCount =
    isLoading || !data ? 0 : data.pendingVehicles + data.pendingWeapons;

  const items = [
    {
      name: t("dashboard"),
      href: "/officer",
      show: hasPermissions([Permissions.Leo], true),
    },
    {
      name: t("myOfficers"),
      href: "/officer/my-officers",
      show: hasPermissions([Permissions.Leo], true),
    },
    {
      name: t("myOfficerLogs"),
      href: "/officer/my-officer-logs",
      show: hasPermissions([Permissions.Leo], true),
    },
    {
      name: t("penalCodes"),
      href: "/officer/penal-codes",
      show: hasPermissions([Permissions.Leo], true),
    },
    {
      name: t("incidents"),
      href: "/officer/incidents",
      show: hasPermissions([Permissions.ManageIncidents, Permissions.ViewIncidents], true),
    },
    {
      name: t("impoundLot"),
      href: "/officer/impound-lot",
      show: hasPermissions([Permissions.ManageImpoundLot, Permissions.ViewImpoundLot], true),
    },
    {
      name: t("jail"),
      href: "/officer/jail",
      show: hasPermissions([Permissions.ManageJail, Permissions.ViewJail], true),
    },
    {
      name: t("callHistory"),
      href: "/officer/call-history",
      show:
        CALLS_911 &&
        hasPermissions([Permissions.ViewCallHistory, Permissions.ManageCallHistory], true),
    },
    {
      name: t("dmv"),
      href: "/officer/dmv",
      show: DMV && hasPermissions([Permissions.ManageDMV], true),
    },
    {
      name: t("bureauOfFirearms"),
      href: "/officer/bureau-of-firearms",
      show: BUREAU_OF_FIREARMS && hasPermissions([Permissions.ManageBureauOfFirearms], true),
    },
    {
      name: t("citizenLogs"),
      href: "/officer/supervisor/citizen-logs",
      show: hasPermissions([Permissions.ViewCitizenLogs], (u) => u.isSupervisor),
    },
    {
      name: t("licenseExams"),
      href: "/officer/supervisor/exams",
      show:
        LICENSE_EXAMS &&
        hasPermissions(
          [Permissions.ViewLicenseExams, Permissions.ManageLicenseExams],
          (u) => u.isSupervisor,
        ),
    },
    {
      name: t("manageUnits"),
      href: "/admin/manage/units",
      show: hasPermissions([Permissions.ManageUnits, Permissions.ViewUnits], (u) => u.isSupervisor),
    },
  ] as const;

  return (
    <Dropdown
      className="min-w-[200px]"
      trigger={
        <Button
          role="listitem"
          className={classNames(isActive("/officer") && "font-semibold")}
          variant="transparent"
        >
          <span className="relative">
            {t("officer")}
            {totalNotificationsCount > 0 ? (
              <span className="absolute bg-quinary shadow-md h-4 w-6 grid place-content-center -right-5 -top-1 rounded-full font-sm">
                {totalNotificationsCount}
              </span>
            ) : null}
          </span>

          <span className="mt-1 ml-1">
            <ChevronDown width={15} height={15} className="text-gray-700 dark:text-gray-300" />
          </span>
        </Button>
      }
    >
      {items.map((item) => {
        const show = item.show ?? true;
        const path = item.href;

        if (!show) {
          return null;
        }

        const notifications = {
          "/officer/dmv": data?.pendingVehicles,
          "/officer/bureau-of-firearms": data?.pendingWeapons,
        } as Record<string, number | undefined>;
        const notificationCount = notifications[path];

        return (
          <Dropdown.LinkItem
            className="flex justify-between items-center gap-2"
            key={path}
            href={path}
          >
            {item.name}

            {notificationCount ? (
              <span
                aria-label={notificationCount.toString()}
                className=" bg-tertiary h-6 min-w-[24px] grid place-content-center rounded-full font-sm"
              >
                {notificationCount}
              </span>
            ) : null}
          </Dropdown.LinkItem>
        );
      })}
    </Dropdown>
  );
}
