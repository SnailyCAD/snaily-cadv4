import * as React from "react";
import { Menu, Transition } from "@headlessui/react";
import { useRouter } from "next/router";
import { ChevronDown } from "react-bootstrap-icons";
import Link from "next/link";
import { useFeatureEnabled } from "hooks/useFeatureEnabled";
import { Feature } from "types/prisma";

export const CitizenDropdown = () => {
  const enabled = useFeatureEnabled();
  const router = useRouter();
  const isActive = (route: string) => router.pathname.startsWith(route);

  const items = ["Citizens", "Taxi", "Bleeter", "Truck Logs", "Courthouse", "Business"];

  return (
    <>
      <Menu as="div" className="relative inline-block text-left z-50">
        <Menu.Button
          className={`flex items-center py-3 px-2 text-gray-700 dark:text-gray-200 transition duration-300 ${
            isActive("/citizen") && "font-semibold"
          }`}
        >
          Citizen
          <span className="ml-1 mt-1">
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
          <Menu.Items className="absolute left-0 w-36 mt-0 origin-top-left bg-white dark:bg-dark-bright divide-y divide-gray-100 rounded-md shadow-lg focus:outline-none">
            <div className="px-1 py-1 ">
              <Menu.Item>
                <Link href="/citizen">
                  <a className="text-gray-900 dark:text-gray-200 block hover:bg-gray-200 dark:hover:bg-dark-bg group rounded-md items-center w-full px-3 py-1.5 text-sm transition-all">
                    Citizens
                  </a>
                </Link>
              </Menu.Item>

              {items.map((item) => {
                const upperCase = item.replace(/ +/g, "_").toUpperCase() as Feature;
                const lower = item.replace(/ +/g, "-").toLowerCase();

                if (!enabled[upperCase]) {
                  return null;
                }

                return (
                  <Menu.Item key={item}>
                    <Link href={`/${lower}`}>
                      <a className="text-gray-900 dark:text-gray-200 block hover:bg-gray-200 dark:hover:bg-dark-bg group rounded-md items-center w-full px-3 py-1.5 text-sm transition-all">
                        {item}
                      </a>
                    </Link>
                  </Menu.Item>
                );
              })}
            </div>
          </Menu.Items>
        </Transition>
      </Menu>
    </>
  );
};
