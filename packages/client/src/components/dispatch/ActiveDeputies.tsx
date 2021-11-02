import * as React from "react";
import { useTranslations } from "use-intl";
import { Button } from "components/Button";
import { ManageUnitModal } from "./modals/ManageUnit";
import { useModal } from "context/ModalContext";
import { ModalIds } from "types/ModalIds";
import { ActiveDeputy } from "state/emsFdState";
import { useActiveDeputies } from "hooks/useActiveDeputies";
import { useRouter } from "next/router";
import { makeImageUrl, makeUnitName } from "lib/utils";
import { useGenerateCallsign } from "hooks/useGenerateCallsign";
import { StatusViewMode } from "types/prisma";
import { useAuth } from "context/AuthContext";

export const ActiveDeputies = () => {
  const { activeDeputies } = useActiveDeputies();
  const t = useTranslations();
  const common = useTranslations("Common");
  const { openModal } = useModal();
  const generateCallsign = useGenerateCallsign();
  const { user } = useAuth();

  const router = useRouter();
  const isDispatch = router.pathname === "/dispatch";

  const [tempUnit, setTempUnit] = React.useState<ActiveDeputy | null>(null);

  function handleEditClick(officer: ActiveDeputy) {
    setTempUnit(officer);
    openModal(ModalIds.ManageUnit);
  }

  return (
    <div className="bg-gray-200/80 rounded-md overflow-hidden mt-3">
      <header className="bg-gray-300/50 px-4 p-2">
        <h3 className="text-xl font-semibold">{t("Ems.activeDeputies")}</h3>
      </header>

      <div className="px-4">
        {activeDeputies.length <= 0 ? (
          <p className="py-2">{t("Ems.noActiveDeputies")}</p>
        ) : (
          <div className="overflow-x-auto w-full mt-3 pb-2">
            <table className="overflow-hidden w-full whitespace-nowrap max-h-64">
              <thead>
                <tr>
                  <th>{t("Ems.deputy")}</th>
                  <th>{t("Leo.badgeNumber")}</th>
                  <th>{t("Leo.department")}</th>
                  <th>{t("Leo.division")}</th>
                  <th>{t("Leo.status")}</th>
                  {isDispatch ? <th>{common("actions")}</th> : null}
                </tr>
              </thead>
              <tbody>
                {activeDeputies.map((deputy) => {
                  const color = deputy.status?.color;
                  const useDot = user?.statusViewMode === StatusViewMode.DOT_COLOR;

                  return (
                    <tr style={{ background: !useDot ? color : undefined }} key={deputy.id}>
                      <td className="capitalize flex items-center">
                        {deputy.imageId ? (
                          <img
                            className="rounded-md w-[30px] h-[30px] object-cover mr-2"
                            draggable={false}
                            src={makeImageUrl("units", deputy.imageId)}
                          />
                        ) : null}
                        {generateCallsign(deputy)} {makeUnitName(deputy)}
                      </td>
                      <td>{String(deputy.badgeNumber)}</td>
                      <td>{deputy.department.value.value}</td>
                      <td>{deputy.division.value.value}</td>
                      <td className="flex items-center">
                        {useDot ? (
                          <span
                            style={{ background: deputy.status?.color }}
                            className="block w-3 h-3 rounded-full mr-2"
                          />
                        ) : null}
                        {deputy.status?.value?.value}
                      </td>
                      {isDispatch ? (
                        <td className="w-36">
                          <Button onClick={() => handleEditClick(deputy)} small variant="success">
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

      {tempUnit ? (
        <ManageUnitModal type="ems-fd" onClose={() => setTempUnit(null)} unit={tempUnit} />
      ) : null}
    </div>
  );
};
