import type * as React from "react";
import { Tab } from "@headlessui/react";
import { classNames } from "lib/classNames";

interface Props {
  tabs: string[];
  defaultIndex?: number;
  children: React.ReactNode;
}

export const TabsContainer = ({ defaultIndex, children, tabs }: Props) => {
  return (
    <div className="w-full px-2 sm:px-0">
      <Tab.Group defaultIndex={defaultIndex}>
        <Tab.List className="flex p-1 space-x-1 bg-gray-100 rounded-lg dark:bg-gray-3">
          {tabs.map((tab) => (
            <Tab
              key={tab}
              className={({ selected }) =>
                classNames(
                  "w-full py-1.5 text-sm leading-5 font-medium text-gray-800 dark:text-gray-200 rounded-md transition-all",
                  selected
                    ? "bg-white dark:bg-dark-bg shadow-sm"
                    : "hover:bg-white/[0.12] dark:hover:bg-white/[0.05]",
                )
              }
            >
              {tab}
            </Tab>
          ))}
        </Tab.List>

        <Tab.Panels>{children}</Tab.Panels>
      </Tab.Group>
    </div>
  );
};
