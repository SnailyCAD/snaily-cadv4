import { useQuery } from "@tanstack/react-query";
import { classNames } from "lib/classNames";
import useFetch from "lib/useFetch";
import Link from "next/link";
import { useRouter } from "next/router";
import { useTranslations } from "use-intl";

export function AdminLink() {
  const { execute } = useFetch();
  const { pathname } = useRouter();
  const t = useTranslations("Nav");

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "notifications"],
    queryFn: async () => {
      const { json } = await execute({ path: "/notifications/admin", noToast: true });
      return json;
    },
  });

  const isActive = pathname === "/admin";

  const totalNotificationsCount =
    isLoading || !data ? 0 : Object.values(data).reduce((a, b) => a + b, 0);

  return (
    <Link
      role="listitem"
      href="/admin"
      className={classNames(
        "p-1 nav:px-2 text-gray-700 dark:text-gray-200 transition duration-300",
        isActive && "font-semibold",
      )}
    >
      <span className="relative">
        {t("admin")}
        {totalNotificationsCount > 0 ? (
          <span className="absolute bg-quinary shadow-md h-4 w-6 grid place-content-center -right-5 -top-1 rounded-full font-sm">
            {totalNotificationsCount}
          </span>
        ) : null}
      </span>
    </Link>
  );
}
