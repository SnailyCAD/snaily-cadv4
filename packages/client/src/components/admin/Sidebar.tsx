import * as React from "react";
import { useAuth } from "context/AuthContext";
import { useFeatureEnabled } from "hooks/useFeatureEnabled";
import { classNames } from "lib/classNames";
import Link from "next/link";
import { useRouter } from "next/router";
import { Rank } from "@snailycad/types";
import { useTranslations } from "use-intl";
import { useViewport } from "@casper124578/useful/hooks/useViewport";
import { importRoutes, valueRoutes } from "./Sidebar/route";
import { usePermission, Permissions } from "hooks/usePermission";

const management = [
  "USERS",
  "CITIZENS",
  "UNITS",
  "BUSINESSES",
  "EXPUNGEMENT_REQUESTS",
  "NAME_CHANGE_REQUESTS",
] as const;

export function AdminSidebar() {
  const [menuOpen, setMenuOpen] = React.useState(false);
  const viewport = useViewport();

  const t = useTranslations();
  const man = useTranslations("Management");
  const router = useRouter();
  const { user } = useAuth();
  const features = useFeatureEnabled();
  const { hasPermissions } = usePermission();

  function isMActive(path: string) {
    return router.pathname === path;
  }

  function isImportActive(type: string) {
    return router.asPath.includes("import") && router.asPath.endsWith(type.toLowerCase());
  }

  function isValueActive(type: string) {
    return router.asPath.endsWith(type.toLowerCase());
  }

  function makeType(t: string) {
    return t.replace(/_/g, "-").toLowerCase();
  }

  React.useEffect(() => {
    if (viewport > 900) {
      setMenuOpen(false);
    }
  }, [viewport]);

  return (
    <div className="w-7 nav:w-72">
      <aside
        style={{ height: "calc(100vh - 3.5rem)" }}
        className={classNames(
          "top-14 pt-5 pb-3 px-2 bg-gray-100 dark:bg-[#171717] flex flex-col overflow-x-hidden overflow-y-auto transition-[width] duration-100",
          menuOpen
            ? "fixed z-40 w-72 justify-start items-start"
            : "sticky w-14 nav:w-72 justify-end nav:justify-start items-center nav:items-start",
        )}
      >
        <div className={menuOpen ? "block" : "hidden nav:block"} id="sidebar-content">
          <section>
            <h1 className="px-3 text-2xl font-semibold dark:text-white">{man("management")}</h1>
            <ul className="flex flex-col space-y-1.5 mt-3">
              {management.map((type) =>
                (!features.BUSINESS && type === "BUSINESSES") ||
                (!features.COURTHOUSE &&
                  ["EXPUNGEMENT_REQUESTS", "NAME_CHANGE_REQUESTS"].includes(type)) ? null : (
                  <SidebarItem
                    disabled={type !== "UNITS" && user?.rank === Rank.USER}
                    key={type}
                    isActive={isMActive(`/admin/manage/${makeType(type)}`)}
                    href={`/admin/manage/${makeType(type)}`}
                    text={man(`MANAGE_${type}`)}
                    onRouteClick={() => setMenuOpen(false)}
                  />
                ),
              )}

              {user?.rank === Rank.OWNER ? (
                <SidebarItem
                  isActive={isMActive("/admin/manage/cad-settings")}
                  href="/admin/manage/cad-settings"
                  text={man("MANAGE_CAD_SETTINGS")}
                  onRouteClick={() => setMenuOpen(false)}
                />
              ) : null}
            </ul>
          </section>

          {hasPermissions(
            [
              Permissions.ImportCitizens,
              Permissions.ImportRegisteredVehicles,
              Permissions.ImportRegisteredWeapons,
            ],
            true,
          ) ? (
            <section className="mt-3">
              <h1 className="px-3 text-2xl font-semibold dark:text-white">{man("import")}</h1>
              <ul className="flex flex-col space-y-1.5 mt-3">
                {importRoutes.map((route) => {
                  if (route.hidden?.(features) || !hasPermissions(route.permissions, true)) {
                    return null;
                  }

                  return (
                    <SidebarItem
                      key={route.type}
                      isActive={isImportActive(route.type)}
                      href={`/admin/import/${route.type.toLowerCase()}`}
                      text={man(`IMPORT_${route.type}`)}
                      onRouteClick={() => setMenuOpen(false)}
                    />
                  );
                })}
              </ul>
            </section>
          ) : null}

          {user?.rank !== Rank.USER ? (
            <section className="mt-3">
              <h1 className="px-3 text-2xl font-semibold dark:text-white">{t("Values.values")}</h1>
              <ul className="flex flex-col space-y-1.5 mt-3">
                {valueRoutes.map((route) => {
                  if (route.hidden?.(features) || !hasPermissions(route.permissions, true)) {
                    return null;
                  }

                  return (
                    <SidebarItem
                      key={route.type}
                      isActive={isValueActive(route.type.replace("_", "-"))}
                      href={`/admin/values/${route.type.replace("_", "-").toLowerCase()}`}
                      text={t(`${route.type.replace("-", "_")}.MANAGE`)}
                      onRouteClick={() => setMenuOpen(false)}
                    />
                  );
                })}
              </ul>
            </section>
          ) : null}
        </div>

        <button
          aria-label="Open sidebar"
          onClick={() => setMenuOpen((o) => !o)}
          className={classNames("flex flex-col nav:hidden w-7", menuOpen ? "mt-5 ml-3" : "mb-10")}
        >
          <span className="my-0.5 rounded-md h-0.5 w-full bg-white " />
          <span className="my-0.5 rounded-md h-0.5 w-full bg-white " />
          <span className="my-0.5 rounded-md h-0.5 w-full bg-white " />
        </button>
      </aside>
    </div>
  );
}

interface ItemProps {
  isActive: boolean;
  text: string;
  href: string;
  disabled?: boolean;
  onRouteClick(): void;
}

function SidebarItem({ disabled, href, text, isActive, onRouteClick }: ItemProps) {
  return (
    <li className="px-2">
      <Link href={disabled ? "" : href}>
        <a
          onClick={onRouteClick}
          className={classNames(
            "transition-colors rounded-md block px-4 py-1 dark:text-white hover:bg-gray-200 dark:hover:bg-dark-gray",
            isActive && "bg-gray-300 dark:bg-dark-gray dark:text-white",
            disabled &&
              "cursor-not-allowed opacity-60 hover:bg-transparent dark:hover:bg-transparent",
          )}
        >
          {text}
        </a>
      </Link>
    </li>
  );
}
