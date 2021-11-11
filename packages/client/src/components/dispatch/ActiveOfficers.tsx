import * as React from "react";
import { useTranslations } from "use-intl";
import { Button } from "components/Button";
import { ActiveOfficer } from "state/leoState";
import { ManageUnitModal } from "./modals/ManageUnit";
import { useModal } from "context/ModalContext";
import { ModalIds } from "types/ModalIds";
import { useActiveOfficers } from "hooks/useActiveOfficers";
import { useRouter } from "next/router";
import { makeUnitName } from "lib/utils";
import { useGenerateCallsign } from "hooks/useGenerateCallsign";
import { useAuth } from "context/AuthContext";
import { StatusViewMode } from "types/prisma";
import { useImageUrl } from "hooks/useImageUrl";
import { ContextMenu } from "components/context-menu/ContextMenu";

export const ActiveOfficers = () => {
  const { activeOfficers } = useActiveOfficers();
  const t = useTranslations("Leo");
  const common = useTranslations("Common");
  const { openModal } = useModal();
  const generateCallsign = useGenerateCallsign();
  const { user } = useAuth();
  const { makeImageUrl } = useImageUrl();

  const router = useRouter();
  const isDispatch = router.pathname === "/dispatch";

  const [tempUnit, setTempUnit] = React.useState<ActiveOfficer | null>(null);

  function handleEditClick(officer: ActiveOfficer) {
    setTempUnit(officer);
    openModal(ModalIds.ManageUnit);
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
                  <th className="bg-gray-300">{t("status")}</th>
                  {isDispatch ? <th className="bg-gray-300">{common("actions")}</th> : null}
                </tr>
              </thead>
              <tbody>
                {activeOfficers.map((officer) => {
                  const color = officer.status?.color;
                  const useDot = user?.statusViewMode === StatusViewMode.DOT_COLOR;

                  return (
                    <tr style={{ background: !useDot ? color : undefined }} key={officer.id}>
                      <ContextMenu asChild items={[{ name: "Merge" }]}>
                        <td className="flex items-center capitalize">
                          <>
                            {officer.imageId ? (
                              <img
                                className="rounded-md w-[30px] h-[30px] object-cover mr-2"
                                draggable={false}
                                src={makeImageUrl("units", officer.imageId)}
                              />
                            ) : null}
                            {generateCallsign(officer)} {makeUnitName(officer)}
                          </>
                        </td>
                      </ContextMenu>
                      <td>{String(officer.badgeNumber)}</td>
                      <td>{officer.department.value.value}</td>
                      <td>{officer.division.value.value}</td>
                      <td className="flex items-center">
                        {useDot ? (
                          <span
                            style={{ background: officer.status?.color }}
                            className="block w-3 h-3 mr-2 rounded-full"
                          />
                        ) : null}
                        {officer.status?.value?.value}
                      </td>
                      {isDispatch ? (
                        <td className="w-36">
                          <Button onClick={() => handleEditClick(officer)} small variant="success">
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
};
