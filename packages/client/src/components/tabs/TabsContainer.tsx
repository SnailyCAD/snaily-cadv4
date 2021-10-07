import type * as React from "react";
import { Tab } from "@headlessui/react";
import { classNames } from "lib/classNames";

interface Props {
  tabs: string[];
  children: React.ReactNode;
}

export const TabsContainer = ({ children, tabs }: Props) => {
  return (
    <div className="w-full px-2 sm:px-0">
      <Tab.Group>
        <Tab.List className="flex p-1 space-x-1 bg-gray-100 rounded-xl">
          {tabs.map((tab) => (
            <Tab
              key={tab}
              className={({ selected }) =>
                classNames(
                  "w-full py-1.5 text-sm leading-5 font-medium text-gray-800 rounded-lg transition-all",
                  selected ? "bg-white shadow" : "hover:bg-white/[0.12]",
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
