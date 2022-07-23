import { useAreaOfPlay } from "hooks/global/useAreaOfPlay";
import { useActiveDispatchers } from "hooks/realtime/useActiveDispatchers";
import { useTime } from "hooks/shared/useTime";
import { useFeatureEnabled } from "hooks/useFeatureEnabled";
import { classNames } from "lib/classNames";
import { useTranslations } from "next-intl";
import { Wifi } from "react-bootstrap-icons";

interface Props {
  children: React.ReactNode;
}

export function UtilityPanel({ children }: Props) {
  const { showAop, areaOfPlay } = useAreaOfPlay();
  const timeRef = useTime();
  const t = useTranslations("Leo");
  const { activeDispatchers, hasActiveDispatchers } = useActiveDispatchers();
  const { ACTIVE_DISPATCHERS } = useFeatureEnabled();

  return (
    <div className="w-full mb-3 overflow-hidden card">
      <header className="flex items-center justify-between px-4 py-2 mb-2 bg-gray-200 dark:bg-gray-3">
        <h1 className="text-xl font-semibold">
          {t("utilityPanel")}
          {showAop ? <span> - AOP: {areaOfPlay}</span> : null}
        </h1>

        <div className="flex items-center gap-3">
          {ACTIVE_DISPATCHERS ? (
            <span
              title={
                hasActiveDispatchers
                  ? `${activeDispatchers.length} Active Dispatcher(s)`
                  : undefined
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
