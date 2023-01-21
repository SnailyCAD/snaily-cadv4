import { useAreaOfPlay } from "hooks/global/useAreaOfPlay";
import { useActiveDispatchers } from "hooks/realtime/use-active-dispatchers";
import { useTime } from "hooks/shared/useTime";
import { useFeatureEnabled } from "hooks/useFeatureEnabled";
import { classNames } from "lib/classNames";
import { useTranslations } from "next-intl";
import { Wifi } from "react-bootstrap-icons";
import dynamic from "next/dynamic";

const DispatchAOP = dynamic(async () => {
  return (await import("components/dispatch/DispatchAOP")).DispatchAOP;
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

  return (
    <div className="w-full mb-3 card">
      <header className="flex items-center justify-between px-4 py-2 mb-2 bg-gray-200 dark:bg-secondary">
        <h1 className="text-xl font-semibold">
          {t("utilityPanel")}
          {showAop ? isDispatch ? <DispatchAOP /> : <span> - AOP: {areaOfPlay}</span> : null}
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
    </div>
  );
}
