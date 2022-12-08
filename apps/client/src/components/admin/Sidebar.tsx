import * as React from "react";
import { useFeatureEnabled } from "hooks/useFeatureEnabled";
import { classNames } from "lib/classNames";
import Link from "next/link";
import { useRouter } from "next/router";
import { useTranslations } from "use-intl";
import { useViewport } from "@casper124578/useful/hooks/useViewport";
import { importRoutes, managementRoutes, SidebarRoute, valueRoutes } from "./Sidebar/routes";
import { usePermission } from "hooks/usePermission";
import { defaultPermissions, Permissions } from "@snailycad/permissions";
import { SidebarSection } from "./Sidebar/SidebarSection";

export function AdminSidebar() {
  const [menuOpen, setMenuOpen] = React.useState(false);
  const viewport = useViewport();

  const t = useTranslations();
  const man = useTranslations("Management");
  const router = useRouter();

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
          "top-14 pt-5 pb-3 px-2 bg-gray-100 dark:bg-tertiary flex flex-col overflow-x-hidden overflow-y-auto transition-[width] duration-100 thin-scrollbar",
          menuOpen
            ? "fixed z-40 w-72 justify-start items-start"
            : "sticky w-14 nav:w-72 justify-end nav:justify-start items-center nav:items-start",
        )}
      >
        <div className={menuOpen ? "block" : "hidden nav:block w-full"} id="sidebar-content">
          <SidebarSection
            permissions={[
              ...defaultPermissions.defaultManagementPermissions,
              ...defaultPermissions.defaultOwnerPermissions,
            ]}
            title={man("management")}
          >
            <>
              {managementRoutes.map((route) => {
                return (
                  <SidebarItem
                    route={route}
                    key={route.type}
                    isActive={isMActive(`/admin/manage/${makeType(route.type)}`)}
                    href={`/admin/manage/${makeType(route.type)}`}
                    text={man(`MANAGE_${route.type}`)}
                    onRouteClick={() => setMenuOpen(false)}
                  />
                );
              })}

              <SidebarItem
                route={{ permissions: [Permissions.ManageCADSettings], type: "CAD_SETTINGS" }}
                isActive={isMActive("/admin/manage/cad-settings")}
                href="/admin/manage/cad-settings"
                text={man("MANAGE_CAD_SETTINGS")}
                onRouteClick={() => setMenuOpen(false)}
              />
            </>
          </SidebarSection>

          <SidebarSection
            permissions={defaultPermissions.defaultImportPermissions}
            title={man("import")}
          >
            {importRoutes.map((route) => {
              return (
                <SidebarItem
                  route={route}
                  key={route.type}
                  isActive={isImportActive(route.type)}
                  href={`/admin/import/${route.type.toLowerCase()}`}
                  text={man(`IMPORT_${route.type}`)}
                  onRouteClick={() => setMenuOpen(false)}
                />
              );
            })}
          </SidebarSection>

          <SidebarSection
            permissions={defaultPermissions.defaultValuePermissions}
            title={t("Values.values")}
          >
            {valueRoutes.map((route) => {
              return (
                <SidebarItem
                  route={route}
                  key={route.type}
                  isActive={isValueActive(makeType(route.type))}
                  href={`/admin/values/${makeType(route.type).toLowerCase()}`}
                  text={t(`${route.type.replace("-", "_")}.MANAGE`)}
                  onRouteClick={() => setMenuOpen(false)}
                />
              );
            })}
          </SidebarSection>
        </div>

        <button
          type="button"
          aria-label="Open sidebar"
          onClick={() => setMenuOpen((o) => !o)}
          className={classNames("flex flex-col nav:hidden w-7", menuOpen ? "mt-5 ml-3" : "mb-10")}
        >
          <span className="my-0.5 rounded-md h-0.5 w-full bg-white" />
          <span className="my-0.5 rounded-md h-0.5 w-full bg-white" />
          <span className="my-0.5 rounded-md h-0.5 w-full bg-white" />
        </button>
      </aside>
    </div>
  );
}

interface ItemProps {
  isActive: boolean;
  text: string;
  href: string;
  onRouteClick(): void;
  route: SidebarRoute | null;
}

function SidebarItem({ route, href, text, isActive, onRouteClick }: ItemProps) {
  const features = useFeatureEnabled();
  const { hasPermissions } = usePermission();

  if (route && (route.hidden?.(features) || !hasPermissions(route.permissions, true))) {
    return null;
  }

  return (
    <li className="px-2">
      <Link
        onClick={onRouteClick}
        className={classNames(
          "transition-colors rounded-md block px-4 py-1 dark:text-white hover:bg-gray-200 dark:hover:bg-secondary",
          isActive && "bg-gray-300 dark:bg-secondary dark:text-white",
        )}
        href={href}
      >
        {text}
      </Link>
    </li>
  );
}
