import * as React from "react";
import { useAuth } from "context/AuthContext";
import { useFeatureEnabled } from "hooks/useFeatureEnabled";
import { classNames } from "lib/classNames";
import Link from "next/link";
import { useRouter } from "next/router";
import { Rank } from "@snailycad/types";
import { useTranslations } from "use-intl";
import { useViewport } from "@casper124578/useful/hooks/useViewport";
import { importRoutes, managementRoutes, valueRoutes } from "./Sidebar/routes";
import { usePermission } from "hooks/usePermission";
import { defaultPermissions } from "@snailycad/permissions";
import { SidebarSection } from "./Sidebar/SidebarSection";

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
        <div className={menuOpen ? "block" : "hidden nav:block w-full"} id="sidebar-content">
          <SidebarSection
            permissions={defaultPermissions.defaultManagementPermissions}
            title={man("management")}
          >
            <>
              {managementRoutes.map((route) => {
                if (route.hidden?.(features) || !hasPermissions(route.permissions, true)) {
                  return null;
                }

                return (
                  <SidebarItem
                    disabled={route.type !== "UNITS" && user?.rank === Rank.USER}
                    key={route.type}
                    isActive={isMActive(`/admin/manage/${makeType(route.type)}`)}
                    href={`/admin/manage/${makeType(route.type)}`}
                    text={man(`MANAGE_${route.type}`)}
                    onRouteClick={() => setMenuOpen(false)}
                  />
                );
              })}

              {user?.rank === Rank.OWNER ? (
                <SidebarItem
                  isActive={isMActive("/admin/manage/cad-settings")}
                  href="/admin/manage/cad-settings"
                  text={man("MANAGE_CAD_SETTINGS")}
                  onRouteClick={() => setMenuOpen(false)}
                />
              ) : null}
            </>
          </SidebarSection>

          <SidebarSection
            permissions={defaultPermissions.defaultImportPermissions}
            title={man("import")}
          >
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
          </SidebarSection>

          {user?.rank !== Rank.USER ? (
            <SidebarSection
              permissions={defaultPermissions.defaultValuePermissions}
              title={t("Values.values")}
            >
              {valueRoutes.map((route) => {
                if (route.hidden?.(features) || !hasPermissions(route.permissions, true)) {
                  return null;
                }

                return (
                  <SidebarItem
                    key={route.type}
                    isActive={isValueActive(makeType(route.type))}
                    href={`/admin/values/${makeType(route.type).toLowerCase()}`}
                    text={t(`${route.type.replace("-", "_")}.MANAGE`)}
                    onRouteClick={() => setMenuOpen(false)}
                  />
                );
              })}
            </SidebarSection>
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
