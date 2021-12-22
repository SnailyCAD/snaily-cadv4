import * as React from "react";
import { Menu, Transition } from "@headlessui/react";
import { useRouter } from "next/router";
import { ChevronDown } from "react-bootstrap-icons";
import Link from "next/link";
import { useAuth } from "context/AuthContext";
import { useTranslations } from "next-intl";

export function OfficerDropdown() {
  const router = useRouter();
  const t = useTranslations("Nav");
  const isActive = (route: string) => router.pathname.startsWith(route);
  const { user } = useAuth();

  const items = [t("myOfficers"), t("myOfficerLogs"), t("incidents"), t("impoundLot")];

  return (
    <>
      <Menu as="div" className="relative z-50 inline-block text-left">
        <Menu.Button
          className={`flex items-center py-3 px-2 text-gray-700 dark:text-gray-200 transition duration-300 ${
            isActive("/officer") && "font-semibold"
          }`}
        >
          {t("officer")}
          <span className="mt-1 ml-1">
            <ChevronDown width={15} height={15} className="text-gray-700 dark:text-gray-300" />
          </span>
        </Menu.Button>

        <Transition
          as={React.Fragment}
          enter="transition ease-out duration-100"
          enterFrom="transform opacity-0 scale-95"
          enterTo="transform opacity-100 scale-100"
          leave="transition ease-in duration-75"
          leaveFrom="transform opacity-100 scale-100"
          leaveTo="transform opacity-0 scale-95"
        >
          <Menu.Items className="absolute left-0 mt-0 origin-top-left bg-white divide-y divide-gray-100 rounded-md shadow-lg w-36 dark:bg-dark-bright">
            <div className="px-1 py-1 ">
              <Menu.Item>
                <Link href="/officer">
                  <a className="text-gray-900 dark:text-gray-200 block hover:bg-gray-200 dark:hover:bg-dark-bg group rounded-md items-center w-full px-3 py-1.5 text-sm transition-all">
                    {t("dashboard")}
                  </a>
                </Link>
              </Menu.Item>

              {items.map((item) => {
                const path = item.replace(/ +/g, "-").toLowerCase();

                return (
                  <Menu.Item key={item}>
                    <Link href={`/officer/${path}`}>
                      <a className="text-gray-900 dark:text-gray-200 block hover:bg-gray-200 dark:hover:bg-dark-bg group rounded-md items-center w-full px-3 py-1.5 text-sm transition-all">
                        {item}
                      </a>
                    </Link>
                  </Menu.Item>
                );
              })}

              {user?.isSupervisor ? (
                <Menu.Item>
                  <Link href="/admin/manage/units">
                    <a className="text-gray-900 dark:text-gray-200 block hover:bg-gray-200 dark:hover:bg-dark-bg group rounded-md items-center w-full px-3 py-1.5 text-sm transition-all">
                      {t("manageUnits")}
                    </a>
                  </Link>
                </Menu.Item>
              ) : null}
            </div>
          </Menu.Items>
        </Transition>
      </Menu>
    </>
  );
}
