import * as React from "react";
import { useAuth } from "context/AuthContext";
import { useFeatureEnabled } from "hooks/useFeatureEnabled";
import { classNames } from "lib/classNames";
import Link from "next/link";
import { useRouter } from "next/router";
import { Rank, ValueType } from "@snailycad/types";
import { useTranslations } from "use-intl";
import { useViewport } from "@casper124578/useful/hooks/useViewport";

const management = ["USERS", "CITIZENS", "UNITS", "BUSINESSES", "EXPUNGEMENT_REQUESTS"] as const;
const imports = ["CITIZENS", "VEHICLES", "WEAPONS"] as const;
const types = Object.values(ValueType).map((v) => v.replace("_", "-"));

export function AdminSidebar() {
  const [menuOpen, setMenuOpen] = React.useState(false);
  const viewport = useViewport();

  const t = useTranslations();
  const man = useTranslations("Management");
  const router = useRouter();
  const { user } = useAuth();
  const { BUSINESS, COURTHOUSE, WEAPON_REGISTRATION } = useFeatureEnabled();

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
    return t.replace("_", "-").toLowerCase();
  }

  React.useEffect(() => {
    if (viewport > 900) {
      setMenuOpen(false);
    }
  }, [viewport]);

  return (
    <div className="w-7 nav:w-72">
      <aside
        style={{
          transition: "width 100ms",
          overflowX: "hidden",
          minHeight: "calc(100vh - 3.5rem)",
        }}
        className={classNames(
          "top-14 pt-5 px-2 bg-gray-100 dark:bg-[#171717] flex flex-col",
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
                (!BUSINESS && type === "BUSINESSES") ||
                (!COURTHOUSE && type === "EXPUNGEMENT_REQUESTS") ? null : (
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

          {user?.rank !== Rank.USER ? (
            <section className="mt-3">
              <h1 className="px-3 text-2xl font-semibold dark:text-white">{man("import")}</h1>
              <ul className="flex flex-col space-y-1.5 mt-3">
                {imports.map((type) =>
                  type === "WEAPONS" && !WEAPON_REGISTRATION ? null : (
                    <SidebarItem
                      key={type}
                      isActive={isImportActive(type)}
                      href={`/admin/import/${type.toLowerCase()}`}
                      text={man(`IMPORT_${type}`)}
                      onRouteClick={() => setMenuOpen(false)}
                    />
                  ),
                )}
              </ul>
            </section>
          ) : null}

          {user?.rank !== Rank.USER ? (
            <section className="mt-3">
              <h1 className="px-3 text-2xl font-semibold dark:text-white">{t("Values.values")}</h1>
              <ul className="flex flex-col space-y-1.5 mt-3">
                {types.map((type) =>
                  type === "WEAPON" && !WEAPON_REGISTRATION ? null : (
                    <SidebarItem
                      key={type}
                      isActive={isValueActive(type)}
                      href={`/admin/values/${type.toLowerCase()}`}
                      text={t(`${type.replace("-", "_")}.MANAGE`)}
                      onRouteClick={() => setMenuOpen(false)}
                    />
                  ),
                )}
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
