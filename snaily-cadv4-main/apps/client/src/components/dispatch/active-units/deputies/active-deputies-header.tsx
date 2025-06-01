import { Button } from "@snailycad/ui";
import { useActiveDeputies } from "hooks/realtime/useActiveDeputies";
import { Permissions, usePermission } from "hooks/usePermission";
import { classNames } from "lib/classNames";
import { useRouter } from "next/router";
import { Filter } from "react-bootstrap-icons";
import { useActiveUnitsState } from "state/active-unit-state";
import { useModal } from "state/modalState";
import { ModalIds } from "types/modal-ids";
import { useTranslations } from "use-intl";

export function ActiveDeputiesHeader() {
  const router = useRouter();
  const isDispatch = router.pathname === "/dispatch";

  const modalState = useModal();
  const t = useTranslations();
  const common = useTranslations("Common");
  const { activeDeputies } = useActiveDeputies();

  const { showEmsFilters, setShowFilters } = useActiveUnitsState((state) => ({
    showEmsFilters: state.showEmsFilters,
    setShowFilters: state.setShowFilters,
  }));

  const { hasPermissions } = usePermission();
  const hasDispatchPerms = hasPermissions([Permissions.Dispatch]);
  const showCreateTemporaryUnitButton = isDispatch && hasDispatchPerms;

  return (
    <header className="p-2 px-4 bg-gray-200 dark:bg-secondary flex items-center justify-between">
      <h1 className="text-xl font-semibold">{t("Ems.activeDeputies")}</h1>

      <div className="flex items-center gap-2">
        {showCreateTemporaryUnitButton ? (
          <Button
            variant="cancel"
            className={classNames(
              "px-1.5 dark:border dark:border-quinary dark:bg-tertiary dark:hover:brightness-125 group",
            )}
            onPress={() => modalState.openModal(ModalIds.CreateTemporaryUnit, "ems-fd")}
          >
            {t("Leo.createTemporaryUnit")}
          </Button>
        ) : null}
        <Button
          variant="cancel"
          className={classNames(
            "px-2 py-2 dark:border dark:border-quinary dark:bg-tertiary dark:hover:brightness-125 group",
            showEmsFilters && "dark:!bg-secondary !bg-gray-500",
          )}
          onPress={() => setShowFilters("ems-fd", !showEmsFilters)}
          title={common("filters")}
          disabled={activeDeputies.length <= 0}
        >
          <Filter
            className={classNames("group-hover:fill-white", showEmsFilters && "text-white")}
            aria-label={common("filters")}
            size={18}
          />
        </Button>
      </div>
    </header>
  );
}
