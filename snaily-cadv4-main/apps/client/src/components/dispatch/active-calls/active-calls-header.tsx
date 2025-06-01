import { Button } from "@snailycad/ui";
import type { useAsyncTable } from "components/shared/Table";
import { classNames } from "lib/classNames";
import { useTranslations } from "next-intl";
import { Filter } from "react-bootstrap-icons";
import { useCallsFilters } from "state/callsFiltersState";
import type { Full911Call } from "state/dispatch/dispatch-state";
import dynamic from "next/dynamic";
import { ModalIds } from "types/modal-ids";
import { useModal } from "state/modalState";
import { useActiveDispatchers } from "hooks/realtime/use-active-dispatchers";
import { useRouter } from "next/router";

const CallsFilters = dynamic(async () => (await import("./call-filters")).CallsFilters);

interface Props {
  calls: Full911Call[];
  asyncTable: ReturnType<typeof useAsyncTable<Full911Call>>;
}

export function ActiveCallsHeader({ calls, asyncTable }: Props) {
  const { setShowFilters, showFilters } = useCallsFilters((state) => ({
    setShowFilters: state.setShowFilters,
    showFilters: state.showFilters,
  }));

  const router = useRouter();
  const isDispatchRoute = router.pathname === "/dispatch";
  const { hasActiveDispatchers } = useActiveDispatchers();
  const modalState = useModal();
  const t = useTranslations("Calls");

  function handleCreateIncident() {
    modalState.openModal(ModalIds.Manage911Call);
  }

  return (
    <>
      <header className="flex items-center justify-between p-2 px-4 bg-gray-200 dark:bg-secondary">
        <h1 className="text-xl font-semibold">{t("active911Calls")}</h1>
        <div className="flex gap-1">
          <Button
            variant={null}
            className="bg-gray-500 hover:bg-gray-600 dark:border dark:border-quinary dark:bg-tertiary dark:hover:brightness-125 text-white"
            onPress={handleCreateIncident}
            isDisabled={isDispatchRoute ? !hasActiveDispatchers : false}
          >
            {t("create911Call")}
          </Button>
          <Button
            variant="cancel"
            className={classNames(
              "px-2 dark:border dark:border-quinary dark:bg-tertiary dark:hover:brightness-125 group",
              showFilters && "dark:!bg-secondary !bg-gray-500",
            )}
            onPress={() => setShowFilters(!showFilters)}
            title={t("callFilters")}
            disabled={calls.length <= 0}
          >
            <Filter
              className={classNames("group-hover:fill-white", showFilters && "text-white")}
              aria-label={t("callFilters")}
              size={18}
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
