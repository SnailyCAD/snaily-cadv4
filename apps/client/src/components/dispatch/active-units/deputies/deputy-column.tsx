import * as React from "react";
import { useImageUrl } from "hooks/useImageUrl";
import { useValues } from "context/ValuesContext";
import { useUnitStatusChange } from "hooks/shared/useUnitsStatusChange";
import {
  Draggable,
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@snailycad/ui";
import { DndActions } from "types/dnd-actions";
import { ActiveUnitsQualificationsCard } from "components/leo/qualifications/ActiveUnitsQualificationsCard";
import { useActiveDeputies } from "hooks/realtime/useActiveDeputies";
import { useActiveDispatchers } from "hooks/realtime/use-active-dispatchers";
import type { CombinedEmsFdUnit, EmsFdDeputy } from "@snailycad/types";
import { useDispatchState } from "state/dispatch/dispatch-state";
import { isUnitCombinedEmsFd } from "@snailycad/utils";
import { useRouter } from "next/router";
import { type ActiveDeputy, useEmsFdState } from "state/ems-fd-state";
import { useModal } from "state/modalState";
import { ModalIds } from "types/modal-ids";
import { useTranslations } from "use-intl";
import type { PostDispatchStatusUnmergeUnitById } from "@snailycad/types/api";
import useFetch from "lib/useFetch";
import { useGenerateCallsign } from "hooks/useGenerateCallsign";
import { makeUnitName } from "lib/utils";
import { ArrowRight } from "react-bootstrap-icons";
import { darkenColor, generateContrastColor } from "lib/table/get-contrasting-text-color";
import { classNames } from "lib/classNames";
import { ImageWrapper } from "components/shared/image-wrapper";

interface Props {
  isDispatch: boolean;
  nameAndCallsign: string;
  deputy: EmsFdDeputy | CombinedEmsFdUnit;
  setTempUnit: React.Dispatch<React.SetStateAction<ActiveDeputy["id"] | null>>;
  textColor?: string | null;
  useDot: boolean;
}

export function DeputyColumn({
  deputy,
  isDispatch,
  nameAndCallsign,
  textColor: statusTextColor,
  setTempUnit,
  useDot,
}: Props) {
  const router = useRouter();
  const isEmsFd = router.pathname.includes("/ems-fd");
  const isEligiblePage = isDispatch || isEmsFd;

  const { activeDeputies, setActiveDeputies } = useActiveDeputies();
  const { hasActiveDispatchers } = useActiveDispatchers();
  const { execute } = useFetch();

  const { setStatus } = useUnitStatusChange({ setUnits: setActiveDeputies, units: activeDeputies });
  const { makeImageUrl } = useImageUrl();
  const { codes10 } = useValues();
  const modalState = useModal();
  const { generateCallsign } = useGenerateCallsign();

  const t = useTranslations("Leo");
  const setDraggingUnit = useDispatchState((state) => state.setDraggingUnit);
  const activeDeputy = useEmsFdState((state) => state.activeDeputy);

  const codesMapped = codes10.values
    .filter((v) => v.type === "STATUS_CODE")
    .map((v) => ({
      name: v.value.value,
      onClick: () => setStatus(deputy.id, v),
      "aria-label": `Set status to ${v.value.value}`,
      title: `Set status to ${v.value.value}`,
    }));

  const dispatchCodes = isDispatch ? codesMapped : [];
  const shouldShowSplit = isDispatch
    ? isUnitCombinedEmsFd(deputy)
    : isUnitCombinedEmsFd(deputy) && deputy.id === activeDeputy?.id;

  const isCurrentDeputy =
    activeDeputy &&
    !isUnitCombinedEmsFd(activeDeputy) &&
    !isUnitCombinedEmsFd(deputy) &&
    activeDeputy.id === deputy.id;

  const canBeOpened = (isDispatch && hasActiveDispatchers) || !isCurrentDeputy || shouldShowSplit;
  const unitStatusColor = deputy.status?.color ?? undefined;
  const darkenedUnitStatusColor = unitStatusColor && darkenColor(unitStatusColor, 0.3);
  const textColor = statusTextColor ?? (unitStatusColor && generateContrastColor(unitStatusColor));
  const canDrag = hasActiveDispatchers && isDispatch;

  function handleMerge(deputy: ActiveDeputy) {
    setTempUnit(deputy.id);
    modalState.openModal(ModalIds.MergeUnit);
  }

  async function handleunMerge(id: string) {
    const { json } = await execute<PostDispatchStatusUnmergeUnitById>({
      path: `/dispatch/status/unmerge/${id}`,
      data: { id },
      method: "POST",
    });

    if (json) {
      router.replace({
        pathname: router.pathname,
        query: router.query,
      });
    }
  }

  const contextMenuActions = [
    {
      name: shouldShowSplit ? t("unmerge") : t("merge"),
      onClick: () => {
        shouldShowSplit ? void handleunMerge(deputy.id) : handleMerge(deputy);
      },
    },
    {
      name: t("privateMessage"),
      onClick: () => modalState.openModal(ModalIds.PrivateMessage, deputy),
    },
    ...dispatchCodes,
  ];

  const canContextMenuBeOpened = isEligiblePage ? (canBeOpened ?? false) : false;

  return (
    <ContextMenu>
      <ContextMenuTrigger disabled={!canContextMenuBeOpened} asChild>
        <span>
          <Draggable
            onDrag={(isDragging) => setDraggingUnit(isDragging ? "move" : null)}
            canDrag={canDrag}
            item={deputy}
            type={DndActions.MoveUnitTo911CallOrIncident}
          >
            {({ isDragging }) => (
              <ActiveUnitsQualificationsCard canBeOpened={!isDragging} unit={deputy}>
                <span // * 9 to fix overlapping issues with next table column
                  style={{ minWidth: nameAndCallsign.length * 9 }}
                  className={classNames("capitalize", canDrag ? "cursor-grab" : "cursor-default")}
                >
                  {!isUnitCombinedEmsFd(deputy) && deputy.imageId ? (
                    <ImageWrapper
                      quality={70}
                      className="rounded-md w-[30px] h-[30px] object-cover mr-2 inline-block"
                      draggable={false}
                      src={makeImageUrl("units", deputy.imageId)!}
                      loading="lazy"
                      width={30}
                      height={30}
                      alt={nameAndCallsign}
                    />
                  ) : null}
                  {isUnitCombinedEmsFd(deputy) ? (
                    <div className="flex items-center">
                      <span
                        style={{
                          backgroundColor: useDot ? unitStatusColor : darkenedUnitStatusColor,
                          color: textColor,
                        }}
                        className="px-1.5 py-0.5 rounded-md dark:bg-secondary"
                      >
                        {generateCallsign(deputy, "pairedUnitTemplate")}
                      </span>
                      <span className="mx-4">
                        <ArrowRight />
                      </span>
                      {deputy.deputies.map((deputy) => (
                        <React.Fragment key={deputy.id}>
                          {generateCallsign(deputy)} {makeUnitName(deputy)} <br />
                        </React.Fragment>
                      ))}
                    </div>
                  ) : (
                    <span
                      style={{
                        backgroundColor: useDot ? unitStatusColor : darkenedUnitStatusColor,
                        color: textColor,
                      }}
                      className="px-1.5 py-0.5 rounded-md dark:bg-secondary"
                    >
                      {nameAndCallsign}
                    </span>
                  )}
                </span>
              </ActiveUnitsQualificationsCard>
            )}
          </Draggable>
        </span>
      </ContextMenuTrigger>

      <ContextMenuContent>
        {contextMenuActions.map((action, idx) => (
          <ContextMenuItem key={`${action.name}-${idx}`} onClick={action.onClick}>
            {action.name}
          </ContextMenuItem>
        ))}
      </ContextMenuContent>
    </ContextMenu>
  );
}
