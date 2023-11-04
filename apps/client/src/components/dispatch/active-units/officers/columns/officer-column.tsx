import * as React from "react";
import type { CombinedLeoUnit, Officer } from "@snailycad/types";
import { useImageUrl } from "hooks/useImageUrl";
import { useValues } from "context/ValuesContext";
import useFetch from "lib/useFetch";
import { useUnitStatusChange } from "hooks/shared/useUnitsStatusChange";
import { isUnitCombined, isUnitOfficer } from "@snailycad/utils";
import { useActiveOfficers } from "hooks/realtime/useActiveOfficers";
import { type ActiveOfficer, useLeoState } from "state/leo-state";
import { ArrowRight } from "react-bootstrap-icons";
import { useModal } from "state/modalState";
import { ModalIds } from "types/modal-ids";
import { useRouter } from "next/router";
import { useTranslations } from "next-intl";
import { useGenerateCallsign } from "hooks/useGenerateCallsign";
import { makeUnitName } from "lib/utils";
import {
  Draggable,
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@snailycad/ui";
import { DndActions } from "types/dnd-actions";
import { useActiveDispatchers } from "hooks/realtime/use-active-dispatchers";
import { classNames } from "lib/classNames";
import { ActiveUnitsQualificationsCard } from "components/leo/qualifications/ActiveUnitsQualificationsCard";
import type { PostDispatchStatusUnmergeUnitById } from "@snailycad/types/api";
import { useDispatchState } from "state/dispatch/dispatch-state";
import { darkenColor, generateContrastColor } from "lib/table/get-contrasting-text-color";
import { ImageWrapper } from "components/shared/image-wrapper";

interface Props {
  officer: Officer | CombinedLeoUnit;
  nameAndCallsign: string;
  setTempUnit: React.Dispatch<React.SetStateAction<ActiveOfficer["id"] | null>>;
  textColor?: string | null;
  useDot: boolean;
}

export function OfficerColumn({
  officer,
  nameAndCallsign,
  textColor: statusTextColor,
  setTempUnit,
  useDot,
}: Props) {
  const { activeOfficers, setActiveOfficers } = useActiveOfficers();

  const modalState = useModal();
  const { setStatus } = useUnitStatusChange({ units: activeOfficers, setUnits: setActiveOfficers });
  const activeOfficer = useLeoState((state) => state.activeOfficer);
  const { makeImageUrl } = useImageUrl();
  const { codes10 } = useValues();
  const { execute } = useFetch();
  const { generateCallsign } = useGenerateCallsign();
  const { hasActiveDispatchers } = useActiveDispatchers();
  const setDraggingUnit = useDispatchState((state) => state.setDraggingUnit);

  const t = useTranslations("Leo");

  const router = useRouter();
  const isDispatch = router.pathname === "/dispatch";
  const isLeo = router.pathname.includes("/officer");
  const isEligiblePage = isDispatch || isLeo;

  const codesMapped = codes10.values
    .filter((v) => v.type === "STATUS_CODE")
    .map((v) => ({
      name: v.value.value,
      onClick: () => setStatus(officer.id, v),
      "aria-label": `Set status to ${v.value.value}`,
      title: `Set status to ${v.value.value}`,
    }));
  const dispatchCodes = isDispatch ? codesMapped : [];

  const shouldShowSplit = isDispatch
    ? isUnitCombined(officer)
    : isUnitCombined(officer) && officer.id === activeOfficer?.id;

  const canBeOpened =
    (isDispatch && hasActiveDispatchers) ||
    shouldShowSplit ||
    (activeOfficer &&
      activeOfficer.id !== officer.id &&
      isUnitOfficer(officer) &&
      isUnitOfficer(activeOfficer));

  const canDrag = hasActiveDispatchers && isDispatch;

  function handleMerge(officer: ActiveOfficer | CombinedLeoUnit) {
    setTempUnit(officer.id);
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

  const unitStatusColor = officer.status?.color ?? undefined;
  const darkenedUnitStatusColor = unitStatusColor && darkenColor(unitStatusColor, 0.3);
  const textColor = statusTextColor ?? (unitStatusColor && generateContrastColor(unitStatusColor));
  const contextMenuActions = [
    {
      name: shouldShowSplit ? t("unmerge") : t("merge"),
      onClick: () => {
        shouldShowSplit ? void handleunMerge(officer.id) : handleMerge(officer);
      },
    },
    ...(isDispatch
      ? [
          {
            name: t("privateMessage"),
            onClick: () => modalState.openModal(ModalIds.PrivateMessage, officer),
          },
          ...dispatchCodes,
        ]
      : dispatchCodes),
  ];

  const canContextMenuBeOpened = isEligiblePage ? canBeOpened ?? false : false;

  return (
    <ContextMenu>
      <ContextMenuTrigger disabled={!canContextMenuBeOpened} asChild>
        <span>
          <Draggable
            onDrag={(isDragging) => setDraggingUnit(isDragging ? "move" : null)}
            canDrag={canDrag}
            type={DndActions.MoveUnitTo911CallOrIncident}
            item={officer}
          >
            {({ isDragging }) => (
              <ActiveUnitsQualificationsCard canBeOpened={!isDragging} unit={officer}>
                <span
                  className={classNames("capitalize", canDrag ? "cursor-grab" : "cursor-default")}
                  // * 9 to fix overlapping issues with next table column
                  style={{ minWidth: nameAndCallsign.length * 9 }}
                >
                  {isUnitOfficer(officer) && officer.imageId ? (
                    <ImageWrapper
                      quality={70}
                      className="rounded-md w-[30px] h-[30px] object-cover mr-2 inline-block"
                      draggable={false}
                      src={makeImageUrl("units", officer.imageId)!}
                      loading="lazy"
                      width={30}
                      height={30}
                      alt={nameAndCallsign}
                    />
                  ) : null}

                  {isUnitCombined(officer) ? (
                    <div className="flex items-center">
                      <span
                        style={{
                          backgroundColor: useDot ? unitStatusColor : darkenedUnitStatusColor,
                          color: textColor,
                        }}
                        className="px-1.5 py-0.5 rounded-md dark:bg-secondary"
                      >
                        {generateCallsign(officer, "pairedUnitTemplate")}
                      </span>

                      <ArrowRight className="inline-block mx-4" />
                      <p>
                        {officer.officers.map((officer) => (
                          <React.Fragment key={officer.id}>
                            {generateCallsign(officer)} {makeUnitName(officer)} <br />
                          </React.Fragment>
                        ))}
                      </p>
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
