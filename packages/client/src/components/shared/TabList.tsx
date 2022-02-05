import type * as React from "react";
import * as Tabs from "@radix-ui/react-tabs";
import { classNames } from "lib/classNames";

interface Tab {
  value: string;
  name: string;
}

interface Props<Tabs extends Tab[]> {
  tabs: Tabs;
  defaultValue?: Tabs[number]["value"];
  children: React.ReactNode;
}

export function TabList<Tabs extends Tab[]>({
  children,
  tabs,
  defaultValue = tabs[0]?.value,
}: Props<Tabs>) {
  return (
    <Tabs.Root defaultValue={defaultValue} className="w-full px-2 sm:px-0">
      <Tabs.List className="flex p-1 pl-0 pb-0 gap-x-5 border-b-[1.75px] border-gray-300 dark:border-gray-2">
        {tabs.map((tab) => (
          <Tabs.Trigger
            value={tab.value}
            key={tab.value}
            className={classNames(
              "tabs-list py-1.5 pb-2 border-b-2 border-transparent text-gray-800 dark:text-gray-200 transition-border",
            )}
          >
            {tab.name}
          </Tabs.Trigger>
        ))}
      </Tabs.List>

      <div className="mt-3">{children}</div>
    </Tabs.Root>
  );
}

export const TabsContent = Tabs.Content;
