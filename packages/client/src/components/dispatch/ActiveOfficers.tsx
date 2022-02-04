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

export function ActiveOfficers() {
  const { activeOfficers } = useActiveOfficers();
  const { activeOfficer } = useLeoState();
  const t = useTranslations("Leo");
  const common = useTranslations("Common");
  const { openModal } = useModal();
  const generateCallsign = useGenerateCallsign();
  const { user } = useAuth();
  const { makeImageUrl } = useImageUrl();
  const { codes10 } = useValues();
  const { execute } = useFetch();
  const { hasActiveDispatchers } = useActiveDispatchers();

  const router = useRouter();
  const isDispatch = router.pathname === "/dispatch";

  const [tempUnit, setTempUnit] = React.useState<ActiveOfficer | CombinedLeoUnit | null>(null);

  function handleEditClick(officer: ActiveOfficer | CombinedLeoUnit) {
    setTempUnit(officer);
    openModal(ModalIds.ManageUnit);
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

      <div className="px-4">
        {activeOfficers.length <= 0 ? (
          <p className="py-2">{t("noActiveOfficers")}</p>
        ) : (
          <div className="w-full pb-2 mt-3 overflow-x-auto">
            <table className="w-full overflow-hidden whitespace-nowrap">
              <thead>
                <tr>
                  <th className="bg-gray-300">{t("officer")}</th>
                  <th className="bg-gray-300">{t("badgeNumber")}</th>
                  <th className="bg-gray-300">{t("department")}</th>
                  <th className="bg-gray-300">{t("division")}</th>
                  <th className="bg-gray-300">{t("rank")}</th>
                  <th className="bg-gray-300">{t("status")}</th>
                  {isDispatch ? <th className="bg-gray-300">{common("actions")}</th> : null}
                </tr>
              </thead>
              <tbody>
                {activeOfficers.map((officer) => {
                  const color = officer.status?.color;
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

                  return (
                    <tr
                      style={{ background: !useDot ? color ?? undefined : undefined }}
                      key={officer.id}
                    >
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
                                    shouldShowSplit
                                      ? handleunMerge(officer.id)
                                      : handleMerge(officer.id);
                                  },
                                },
                              ]
                        }
                      >
                        <td className="flex items-center capitalize">
                          {"imageId" in officer && officer.imageId ? (
                            <img
                              className="rounded-md w-[30px] h-[30px] object-cover mr-2"
                              draggable={false}
                              src={makeImageUrl("units", officer.imageId)}
                            />
                          ) : null}
                          {"officers" in officer ? (
                            <div className="flex items-center">
                              {officer.callsign}
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
                        </td>
                      </ContextMenu>
                      <td>{!("officers" in officer) && String(officer.badgeNumber)}</td>
                      <td>
                        {(!("officers" in officer) && officer.department?.value.value) ??
                          common("none")}
                      </td>
                      <td>{!("officers" in officer) && formatUnitDivisions(officer)}</td>
                      <td>{(!("officers" in officer) && officer.rank?.value) ?? common("none")}</td>
                      <td className={useDot ? "flex items-center" : undefined}>
                        {useDot && officer.status?.color ? (
                          <span
                            style={{ background: officer.status?.color }}
                            className="block w-3 h-3 mr-2 rounded-full"
                          />
                        ) : null}
                        {officer.status?.value?.value}
                      </td>
                      {isDispatch ? (
                        <td className="w-36">
                          <Button
                            disabled={!hasActiveDispatchers}
                            onClick={() => handleEditClick(officer)}
                            small
                            variant="success"
                          >
                            {common("manage")}
                          </Button>
                        </td>
                      ) : null}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {tempUnit ? <ManageUnitModal onClose={() => setTempUnit(null)} unit={tempUnit} /> : null}
    </div>
  );
}
