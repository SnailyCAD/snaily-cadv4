import { Button } from "@snailycad/ui";
import type { useAsyncTable } from "components/shared/Table";
import { classNames } from "lib/classNames";
import { useTranslations } from "next-intl";
import { Filter } from "react-bootstrap-icons";
import { useCallsFilters } from "state/callsFiltersState";
import type { Full911Call } from "state/dispatch/dispatch-state";
import dynamic from "next/dynamic";

const CallsFilters = dynamic(async () => (await import("./call-filters")).CallsFilters);

interface Props {
  calls: Full911Call[];
  asyncTable: ReturnType<typeof useAsyncTable<Full911Call>>;
}

export function ActiveCallsHeader({ calls, asyncTable }: Props) {
  const { setShowFilters, showFilters } = useCallsFilters();
  const t = useTranslations("Calls");

  return (
    <>
      <header className="flex items-center justify-between p-2 px-4 bg-gray-200 dark:bg-secondary">
        <h1 className="text-xl font-semibold">{t("active911Calls")}</h1>
        <div>
          <Button
            variant="cancel"
            className={classNames(
              "px-1.5 dark:border dark:border-quinary dark:bg-tertiary dark:hover:brightness-125 group",
              showFilters && "dark:!bg-secondary !bg-gray-500",
            )}
            onPress={() => setShowFilters(!showFilters)}
            title={t("callFilters")}
            disabled={calls.length <= 0}
          >
            <Filter
              className={classNames("group-hover:fill-white", showFilters && "text-white")}
              aria-label={t("callFilters")}
            />
          </Button>
        </div>
      </header>

      {showFilters ? (
        <div className="px-4">
          <CallsFilters asyncTable={asyncTable} calls={calls} />
        </div>
      ) : null}
    </>
  );
}
