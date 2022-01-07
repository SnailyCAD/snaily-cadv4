import type * as React from "react";
import { Tab } from "@headlessui/react";
import { classNames } from "lib/classNames";

interface Props {
  tabs: string[];
  defaultIndex?: number;
  children: React.ReactNode;
}

export function TabsContainer({ defaultIndex, children, tabs }: Props) {
  return (
    <div className="w-full px-2 sm:px-0">
      <Tab.Group defaultIndex={defaultIndex}>
        <Tab.List className="flex p-1 pl-0 pb-0 gap-x-5 border-b-[1.5px] border-gray-2">
          {tabs.map((tab) => (
            <Tab
              key={tab}
              className={({ selected }) =>
                classNames(
                  "py-1.5 pb-2 border-b-2 border-transparent text-gray-800 dark:text-gray-200 transition-colors",
                  selected
                    ? "text-black dark:text-white border-b-2 border-gray-400 dark:border-[#4c4f55]"
                    : "text-neutral-800 dark:text-gray-300/75 hover:border-gray-300 hover:dark:border-[#303236]",
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
}
