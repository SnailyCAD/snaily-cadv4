import { useAreaOfPlay } from "hooks/global/useAreaOfPlay";
import { useActiveDispatchers } from "hooks/realtime/use-active-dispatchers";
import { useTime } from "hooks/shared/useTime";
import { useFeatureEnabled } from "hooks/useFeatureEnabled";
import { classNames } from "lib/classNames";
import { useTranslations } from "next-intl";
import { Grid1x2Fill, Wifi } from "react-bootstrap-icons";
import dynamic from "next/dynamic";
import { Button } from "@snailycad/ui";
import { useModal } from "state/modalState";
import { ModalIds } from "types/modal-ids";
import { EditDashboardLayoutModal } from "./edit-dashboard-layout-modal";

const DispatchAreaOfPlay = dynamic(async () => {
  return (await import("components/dispatch/dispatch-area-of-play")).DispatchAreaOfPlay;
});

interface Props {
  children: React.ReactNode;
  isDispatch?: boolean;
}

export function UtilityPanel({ children, isDispatch }: Props) {
  const { showAop, areaOfPlay } = useAreaOfPlay();
  const timeRef = useTime();
  const t = useTranslations("Leo");
  const { activeDispatchersCount, hasActiveDispatchers } = useActiveDispatchers();
  const { ACTIVE_DISPATCHERS } = useFeatureEnabled();
  const modalState = useModal();

  return (
    <div className="w-full mb-3 card overflow-y-hidden">
      <header className="flex items-center justify-between px-4 py-2 mb-2 bg-gray-200 dark:bg-secondary">
        <h1 className="text-xl font-semibold">
          {t("utilityPanel")}
          {showAop ? isDispatch ? <DispatchAreaOfPlay /> : <span> - AOP: {areaOfPlay}</span> : null}
        </h1>

        <div className="flex items-center gap-3">
          {ACTIVE_DISPATCHERS ? (
            <span
              title={
                hasActiveDispatchers ? `${activeDispatchersCount} Active Dispatcher(s)` : undefined
              }
            >
              <Wifi
                width={20}
                height={20}
                className={classNames(
                  "fill-current transition-colors text-gray-300",
                  hasActiveDispatchers && "text-green-500",
                )}
              />
            </span>
          ) : null}
          <span ref={timeRef} />
        </div>
      </header>

      {children}

      <footer className="border-t-[1.5px] border-neutral-800 dark:border-secondary status-buttons-grid mt-2 px-4 py-2">
        <Button
          className="flex items-center gap-2"
          size="xs"
          onPress={() => modalState.openModal(ModalIds.EditDashboardLayout)}
        >
          <Grid1x2Fill />
          Edit Dashboard Layout
        </Button>

        <EditDashboardLayoutModal />
      </footer>
    </div>
  );
}
