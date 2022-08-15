import { Button } from "components/Button";
import type { useAsyncTable } from "components/shared/Table";
import { classNames } from "lib/classNames";
import { useTranslations } from "next-intl";
import { Filter } from "react-bootstrap-icons";
import { useCallsFilters } from "state/callsFiltersState";
import type { Full911Call } from "state/dispatch/dispatchState";
import dynamic from "next/dynamic";

const CallsFilters = dynamic(async () => (await import("./CallsFilters")).CallsFilters);

interface Props {
  calls: Full911Call[];
  search: ReturnType<typeof useAsyncTable>["search"];
}

export function ActiveCallsHeader({ calls, search }: Props) {
  const { setShowFilters, showFilters } = useCallsFilters();
  const t = useTranslations("Calls");

  return (
    <>
      <header className="flex items-center justify-between p-2 px-4 bg-gray-200 dark:bg-gray-3">
        <h1 className="text-xl font-semibold">{t("active911Calls")}</h1>
        <div>
          <Button
            variant="cancel"
            className={classNames(
              "px-1.5 hover:bg-gray-500 dark:hover:bg-dark-bg group",
              showFilters && "dark:!bg-dark-bg !bg-gray-500",
            )}
            onClick={() => setShowFilters(!showFilters)}
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

      {calls.length <= 0 && search.state !== "loading" && !search.search ? null : (
        <div className="p-2 px-4">
          <CallsFilters search={search} calls={calls} />
        </div>
      )}
    </>
  );
}
