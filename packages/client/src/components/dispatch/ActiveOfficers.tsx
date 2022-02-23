import * as React from "react";
import { useTranslations } from "use-intl";
import { Button } from "components/Button";
import { ActiveOfficer, useLeoState } from "state/leoState";
import { ManageUnitModal } from "./modals/ManageUnit";
import { useModal } from "context/ModalContext";
import { ModalIds } from "types/ModalIds";
import { useActiveOfficers } from "hooks/realtime/useActiveOfficers";
import { useRouter } from "next/router";
import { formatUnitDivisions, makeUnitName } from "lib/utils";
import { useGenerateCallsign } from "hooks/useGenerateCallsign";
import { useAuth } from "context/AuthContext";
import { CombinedLeoUnit, StatusValue, StatusViewMode } from "@snailycad/types";
import { useImageUrl } from "hooks/useImageUrl";
import { ContextMenu } from "components/shared/ContextMenu";
import { useValues } from "context/ValuesContext";
import useFetch from "lib/useFetch";
import { ArrowRight } from "react-bootstrap-icons";
import { useActiveDispatchers } from "hooks/realtime/useActiveDispatchers";
import { Table } from "components/shared/Table";
import { useFeatureEnabled } from "hooks/useFeatureEnabled";
import type { FullIncident } from "src/pages/officer/incidents";
import { ManageIncidentModal } from "components/leo/modals/ManageIncidentModal";
import { UnitRadioChannelModal } from "./active-units/UnitRadioChannelModal";

export function ActiveOfficers() {
  const { activeOfficers } = useActiveOfficers();
  const { activeOfficer } = useLeoState();
  const t = useTranslations("Leo");
  const common = useTranslations("Common");
  const { openModal } = useModal();
  const { generateCallsign } = useGenerateCallsign();
  const { user } = useAuth();
  const { makeImageUrl } = useImageUrl();
  const { codes10 } = useValues();
  const { execute } = useFetch();
  const { hasActiveDispatchers } = useActiveDispatchers();
  const { ACTIVE_INCIDENTS, RADIO_CHANNEL_MANAGEMENT } = useFeatureEnabled();

  const router = useRouter();
  const isDispatch = router.pathname === "/dispatch";

  const [tempUnit, setTempUnit] = React.useState<ActiveOfficer | CombinedLeoUnit | null>(null);
  const [tempIncident, setTempIncident] = React.useState<FullIncident | null>(null);

  function handleEditClick(officer: ActiveOfficer | CombinedLeoUnit) {
    setTempUnit(officer);
    openModal(ModalIds.ManageUnit);
  }

  function handleIncidentOpen(incident: FullIncident) {
    setTempIncident(incident);
    openModal(ModalIds.ManageIncident);
  }

  async function handleMerge(id: string) {
    await execute("/dispatch/status/merge", {
      data: { id },
      method: "POST",
    });
  }

  async function handleunMerge(id: string) {
    const { json } = await execute(`/dispatch/status/unmerge/${id}`, {
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

  async function setCode(id: string, status: StatusValue) {
    if (status.type === "STATUS_CODE") {
      await execute(`/dispatch/status/${id}`, {
        method: "PUT",
        data: { status: status.id },
      });
    }
  }

  return (
    <div className="overflow-hidden rounded-md bg-gray-200/80 dark:bg-gray-2">
      <header className="p-2 px-4 bg-gray-300/50 dark:bg-gray-3">
        <h3 className="text-xl font-semibold">{t("activeOfficers")}</h3>
      </header>

      {activeOfficers.length <= 0 ? (
        <p className="px-4 py-2">{t("noActiveOfficers")}</p>
      ) : (
        <Table
          isWithinCard
          containerProps={{ className: "mb-3 px-4" }}
          data={activeOfficers.map((officer) => {
            const color = officer.status?.color;
            const activeIncident =
              "officers" in officer ? null : (officer.activeIncident as FullIncident | null);
            const useDot = user?.statusViewMode === StatusViewMode.DOT_COLOR;
            const shouldShowSplit =
              activeOfficer &&
              "officers" in activeOfficer &&
              "officers" in officer &&
              officer.id === activeOfficer.id;

            const canBeOpened =
              isDispatch ||
              shouldShowSplit ||
              (activeOfficer &&
                activeOfficer.id !== officer.id &&
                !("officers" in officer) &&
                !("officers" in activeOfficer));

            const codesMapped = codes10.values
              .filter((v) => v.type === "STATUS_CODE")
              .map((v) => ({
                name: v.value.value,
                onClick: () => setCode(officer.id, v),
                "aria-label": `Set status to ${v.value.value}`,
                title: `Set status to ${v.value.value}`,
              }));

            return {
              rowProps: { style: { background: !useDot ? color ?? undefined : undefined } },
              officer: (
                <ContextMenu
                  canBeOpened={canBeOpened ?? false}
                  asChild
                  items={
                    isDispatch
                      ? codesMapped
                      : [
                          {
                            name: shouldShowSplit ? t("unmerge") : t("merge"),
                            onClick: () => {
                              shouldShowSplit ? handleunMerge(officer.id) : handleMerge(officer.id);
                            },
                          },
                        ]
                  }
                >
                  <span className="flex items-center capitalize cursor-default">
                    {"imageId" in officer && officer.imageId ? (
                      <img
                        className="rounded-md w-[30px] h-[30px] object-cover mr-2"
                        draggable={false}
                        src={makeImageUrl("units", officer.imageId)}
                      />
                    ) : null}
                    {"officers" in officer ? (
                      <div className="flex items-center">
                        {generateCallsign(officer, "pairedUnitTemplate")}
                        <span className="mx-4">
                          <ArrowRight />
                        </span>
                        {officer.officers.map((officer) => (
                          <React.Fragment key={officer.id}>
                            {generateCallsign(officer)} {makeUnitName(officer)} <br />
                          </React.Fragment>
                        ))}
                      </div>
                    ) : (
                      `${generateCallsign(officer)} ${makeUnitName(officer)}`
                    )}
                  </span>
                </ContextMenu>
              ),
              badgeNumber: !("officers" in officer) && String(officer.badgeNumber),
              department:
                (!("officers" in officer) && officer.department?.value.value) ?? common("none"),
              division: !("officers" in officer) && formatUnitDivisions(officer),
              rank: (!("officers" in officer) && officer.rank?.value) ?? common("none"),
              status: (
                <span className="flex items-center">
                  {useDot && color ? (
                    <span
                      style={{ background: color }}
                      className="block w-3 h-3 mr-2 rounded-full"
                    />
                  ) : null}
                  {officer.status?.value?.value}
                </span>
              ),
              incident: activeIncident ? (
                <Button
                  onClick={() =>
                    handleIncidentOpen({
                      ...activeIncident,
                      isActive: true,
                    } as FullIncident)
                  }
                >
                  #{activeIncident.caseNumber}
                </Button>
              ) : (
                common("none")
              ),
              // todo: add component for this row with button & modal to change radioChannelId
              radioChannel:
                "radioChannelId" in officer ? <UnitRadioChannelModal unit={officer} /> : null,
              actions: isDispatch ? (
                <>
                  <Button
                    disabled={!hasActiveDispatchers}
                    onClick={() => handleEditClick(officer)}
                    small
                    variant="success"
                  >
                    {common("manage")}
                  </Button>
                </>
              ) : null,
            };
          })}
          columns={[
            { Header: t("officer"), accessor: "officer" },
            { Header: t("badgeNumber"), accessor: "badgeNumber" },
            { Header: t("department"), accessor: "department" },
            { Header: t("division"), accessor: "division" },
            { Header: t("rank"), accessor: "rank" },
            { Header: t("status"), accessor: "status" },
            ACTIVE_INCIDENTS ? { Header: t("incident"), accessor: "incident" } : null,
            RADIO_CHANNEL_MANAGEMENT
              ? { Header: t("radioChannel"), accessor: "radioChannel" }
              : null,
            isDispatch ? { Header: common("actions"), accessor: "actions" } : null,
          ]}
        />
      )}

      {tempUnit ? <ManageUnitModal onClose={() => setTempUnit(null)} unit={tempUnit} /> : null}
      {tempIncident ? (
        <ManageIncidentModal incident={tempIncident} onClose={() => setTempIncident(null)} />
      ) : null}
    </div>
  );
}
