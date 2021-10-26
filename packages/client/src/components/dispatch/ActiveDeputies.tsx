import * as React from "react";
import { useTranslations } from "use-intl";
import { Button } from "components/Button";
import { ManageUnitModal } from "./modals/ManageUnit";
import { useModal } from "context/ModalContext";
import { ModalIds } from "types/ModalIds";
import { ActiveDeputy } from "state/emsFdState";
import { useActiveDeputies } from "hooks/useActiveDeputies";
import { useRouter } from "next/router";

export const ActiveDeputies = () => {
  const { activeDeputies } = useActiveDeputies();
  const t = useTranslations();
  const common = useTranslations("Common");
  const { openModal } = useModal();

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
                {activeDeputies.map((officer) => (
                  <tr key={officer.id}>
                    <td>
                      {officer.callsign} {officer.name}
                    </td>
                    <td>{String(officer.badgeNumber)}</td>
                    <td>{officer.department.value}</td>
                    <td>{officer.division.value.value}</td>
                    <td>{officer.status2?.value?.value}</td>
                    {isDispatch ? (
                      <td className="w-36">
                        <Button onClick={() => handleEditClick(officer)} small variant="success">
                          {common("manage")}
                        </Button>
                      </td>
                    ) : null}
                  </tr>
                ))}
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
