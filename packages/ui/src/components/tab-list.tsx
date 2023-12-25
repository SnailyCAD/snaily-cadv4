import * as React from "react";
import * as Tabs from "@radix-ui/react-tabs";
import { useRouter } from "next/router";

interface TabListStore {
  upsertTabTitle(value: string, name?: string): void;
}

const TabListContext = React.createContext<TabListStore | undefined>(undefined);
function useTabList() {
  const context = React.useContext(TabListContext);
  if (!context) {
    throw new Error("`useTabList` must be used within a `TabListProvider`");
  }

  return context;
}

interface Tab {
  value: string;
  name: string;
}

interface Props<Tabs extends Tab[]> {
  tabs: Tabs;
  defaultValue?: Tabs[number]["value"];
  children: React.ReactNode;
  queryState?: boolean;
  onValueChange?(value: string): void;
  activeTab?: string;
}

export function TabList<Tabs extends Tab[]>({
  children,
  tabs,
  defaultValue = tabs[0]?.value,
  onValueChange,
  queryState = true,
  activeTab: _activeTab,
}: Props<Tabs>) {
  const [titles, setTitles] = React.useState<Record<string, string>>({});
  const router = useRouter();
  const activeTab = queryState ? (router.query.activeTab as string | undefined) : _activeTab;

  function upsertTabTitle(value: string, name?: string) {
    if (!name) return;
    setTitles((prev) => ({ ...prev, [value]: name }));
  }

  function handleValueChange(value: string) {
    onValueChange?.(value);

    if (queryState) {
      const [asPathWithoutQueryParams] = router.asPath.split("?");

      router.replace(
        router.pathname,
        { pathname: asPathWithoutQueryParams, query: { activeTab: value } },
        { shallow: true },
      );
    }
  }

  return (
    <TabListContext.Provider value={{ upsertTabTitle }}>
      <Tabs.Root
        value={_activeTab ? activeTab : undefined}
        onValueChange={handleValueChange}
        defaultValue={activeTab || defaultValue}
        className="w-full px-2 sm:px-0"
      >
        <Tabs.List className="relative flex p-1 pl-0 pb-0 gap-x-5 overflow-y-auto thin-scrollbar">
          {tabs.map((tab) => {
            const tabTitle = titles[tab.value] || tab.name;

            return (
              <Tabs.Trigger
                value={tab.value}
                key={tab.value}
                className={
                  "z-20 tabs-list py-1.5 pb-2 border-b-2 border-transparent text-gray-800 dark:text-gray-200 transition-border duration-100 min-w-fit"
                }
              >
                {tabTitle}
              </Tabs.Trigger>
            );
          })}
          <span className="absolute bottom-0 z-10 h-[2px] w-full bg-gray-300 dark:bg-tertiary" />
        </Tabs.List>

        <div className="mt-3">{children}</div>
      </Tabs.Root>
    </TabListContext.Provider>
  );
}

export function TabsContent({ tabName, ...props }: Tabs.TabsContentProps & { tabName?: string }) {
  const ctx = useTabList();

  React.useEffect(() => {
    ctx.upsertTabTitle(props.value, tabName);
  }, [props.value, tabName]); // eslint-disable-line

  return <Tabs.Content {...props}>{props.children}</Tabs.Content>;
}
