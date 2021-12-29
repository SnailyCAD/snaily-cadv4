import { useAuth } from "context/AuthContext";
import { classNames } from "lib/classNames";
import Link from "next/link";
import { useRouter } from "next/router";
import { rank, valueType } from "types/prisma";
import { useTranslations } from "use-intl";

const management = ["USERS", "CITIZENS", "UNITS", "BUSINESSES"];
const types = Object.values(valueType).map((v) => v.replace("_", "-"));

export function AdminSidebar() {
  const t = useTranslations();
  const man = useTranslations("Management");
  const router = useRouter();
  const { user } = useAuth();

  function isMActive(path: string) {
    return router.pathname === path;
  }

  function isValueActive(type: string) {
    return router.asPath.endsWith(type.toLowerCase());
  }

  return (
    <div className="w-60">
      <aside className="sticky w-60 left-4 top-5 bg-gray-200 dark:bg-[#171717] rounded-md py-2">
        <section>
          <h1 className="px-3 text-2xl font-semibold dark:text-white">{man("management")}</h1>
          <ul className="flex flex-col space-y-1.5 mt-3">
            {management.map((type) => (
              <SidebarItem
                disabled={type !== "UNITS" && user?.rank === "USER"}
                key={type}
                isActive={isMActive(`/admin/manage/${type.toLowerCase()}`)}
                href={`/admin/manage/${type.toLowerCase()}`}
                text={man(`MANAGE_${type}`)}
              />
            ))}

            {user?.rank === rank.OWNER ? (
              <SidebarItem
                isActive={isMActive("/admin/manage/cad-settings")}
                href="/admin/manage/cad-settings"
                text={man("MANAGE_CAD_SETTINGS")}
              />
            ) : null}
          </ul>
        </section>

        {user?.rank !== "USER" ? (
          <section className="mt-3">
            <h1 className="px-3 text-2xl font-semibold dark:text-white">{t("Values.values")}</h1>
            <ul className="flex flex-col space-y-1.5 mt-3">
              {types.map((type) => (
                <SidebarItem
                  key={type}
                  isActive={isValueActive(type)}
                  href={`/admin/values/${type.toLowerCase()}`}
                  text={t(`${type.replace("-", "_")}.MANAGE`)}
                />
              ))}
            </ul>
          </section>
        ) : null}
      </aside>
    </div>
  );
}

interface ItemProps {
  isActive: boolean;
  text: string;
  href: string;
  disabled?: boolean;
}

function SidebarItem({ disabled, href, text, isActive }: ItemProps) {
  return (
    <li className="px-2">
      <Link href={disabled ? "" : href}>
        <a
          className={classNames(
            "transition-colors rounded-md block px-4 py-1 dark:text-white hover:bg-gray-300 dark:hover:bg-dark-gray",
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
