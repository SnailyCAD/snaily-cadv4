import { Button } from "@snailycad/ui";
import { useActiveDispatchers } from "hooks/realtime/use-active-dispatchers";
import { useActiveOfficers } from "hooks/realtime/useActiveOfficers";
import { Permissions, usePermission } from "hooks/usePermission";
import { classNames } from "lib/classNames";
import { useRouter } from "next/router";
import { Filter } from "react-bootstrap-icons";
import { useActiveUnitsState } from "state/active-unit-state";
import { useModal } from "state/modalState";
import { ModalIds } from "types/modal-ids";
import { useTranslations } from "use-intl";

export function ActiveOfficersHeader() {
  const router = useRouter();
  const isDispatch = router.pathname === "/dispatch";

  const modalState = useModal();
  const t = useTranslations("Leo");
  const common = useTranslations("Common");
  const { activeOfficers } = useActiveOfficers();

  const { showLeoFilters, setShowFilters } = useActiveUnitsState((state) => ({
    showLeoFilters: state.showLeoFilters,
    setShowFilters: state.setShowFilters,
  }));

  const { hasPermissions } = usePermission();
  const hasDispatchPerms = hasPermissions([Permissions.Dispatch]);
  const showCreateTemporaryUnitButton = isDispatch && hasDispatchPerms;
  const { userActiveDispatcher } = useActiveDispatchers();

  return (
    <header className="p-2 px-4 bg-gray-200 dark:bg-secondary flex items-center justify-between">
      <h1 className="text-xl font-semibold">{t("activeOfficers")}</h1>

      <div className="flex items-center gap-2">
        {showCreateTemporaryUnitButton ? (
          <Button
            isDisabled={!userActiveDispatcher}
            variant="cancel"
            className={classNames(
              "px-1.5 dark:border dark:border-quinary dark:bg-tertiary dark:hover:brightness-125 group",
            )}
            onPress={() => modalState.openModal(ModalIds.CreateTemporaryUnit, "officer")}
          >
            {t("createTemporaryUnit")}
          </Button>
        ) : null}

        <Button
          variant="cancel"
          className={classNames(
            "px-2 py-2 dark:border dark:border-quinary dark:bg-tertiary dark:hover:brightness-125 group",
            showLeoFilters && "dark:!bg-secondary !bg-gray-500",
          )}
          onPress={() => setShowFilters("leo", !showLeoFilters)}
          title={common("filters")}
          disabled={activeOfficers.length <= 0}
        >
          <Filter
            className={classNames("group-hover:fill-white", showLeoFilters && "text-white")}
            aria-label={common("filters")}
            size={18}
          />
        </Button>
      </div>
    </header>
  );
}
