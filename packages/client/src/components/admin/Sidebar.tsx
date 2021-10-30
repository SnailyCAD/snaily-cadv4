import { useAuth } from "context/AuthContext";
import Link from "next/link";
import { useRouter } from "next/router";
import { rank, valueType } from "types/prisma";
import { useTranslations } from "use-intl";

const management = ["USERS", "CITIZENS", "UNITS", "BUSINESSES"];
const types = Object.values(valueType).map((v) => v.replace("_", "-"));

export const AdminSidebar = () => {
  const t = useTranslations();
  const man = useTranslations("Management");
  const router = useRouter();
  const { user } = useAuth();

  const isMActive = (path: string) => {
    return router.pathname === path;
  };

  const isValueActive = (type: string) => {
    return typeof router.query.path === "string" && router.query.path.toUpperCase() === type;
  };

  return (
    <div className="w-60">
      <aside
        style={{ minHeight: "100vh" }}
        className="absolute w-60 left-0 -top-2 bg-gray-200 rounded-md py-2"
      >
        <section>
          <h1 className="text-2xl font-semibold px-3">{man("management")}</h1>
          <ul className="flex flex-col space-y-1.5 mt-3">
            {management.map((type) => (
              <li key={type} className="px-2">
                <Link href={`/admin/manage/${type.toLowerCase()}`}>
                  <a
                    className={`transition-colors rounded-md block px-4 py-1.5 hover:bg-gray-300 ${
                      isMActive(`/admin/manage/${type.toLowerCase()}`) && "bg-gray-300"
                    }`}
                  >
                    {man(`MANAGE_${type}`)}
                  </a>
                </Link>
              </li>
            ))}

            {user?.rank === rank.OWNER ? (
              <li className="px-2">
                <Link href={"/admin/manage/cad-settings"}>
                  <a
                    className={`transition-colors rounded-md block px-4 py-1.5 hover:bg-gray-300 ${
                      isMActive("/admin/manage/cad-settings") && "bg-gray-300"
                    }`}
                  >
                    {man("MANAGE_CAD_SETTINGS")}
                  </a>
                </Link>
              </li>
            ) : null}
          </ul>
        </section>

        <section className="mt-3">
          <h1 className="text-2xl font-semibold px-3">{t("Values.values")}</h1>
          <ul className="flex flex-col space-y-1.5 mt-3">
            {types.map((type) => (
              <li key={type} className="px-2">
                <Link href={`/admin/values/${type.toLowerCase()}`}>
                  <a
                    className={`transition-colors rounded-md block px-4 py-1 hover:bg-gray-300 ${
                      isValueActive(type) && "bg-gray-300"
                    }`}
                  >
                    {t(`${type.replace("-", "_")}.MANAGE`)}
                  </a>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </aside>
    </div>
  );
};
