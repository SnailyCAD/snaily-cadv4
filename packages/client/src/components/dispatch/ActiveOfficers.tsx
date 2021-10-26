import * as React from "react";
import { useTranslations } from "use-intl";
import { Button } from "components/Button";
import { ActiveOfficer } from "state/leoState";
import { ManageUnitModal } from "./modals/ManageUnit";
import { useModal } from "context/ModalContext";
import { ModalIds } from "types/ModalIds";
import { useActiveOfficers } from "hooks/useActiveOfficers";
import { useRouter } from "next/router";

export const ActiveOfficers = () => {
  const { activeOfficers } = useActiveOfficers();
  const t = useTranslations("Leo");
  const common = useTranslations("Common");
  const { openModal } = useModal();

  const router = useRouter();
  const isDispatch = router.pathname === "/dispatch";

  const [tempUnit, setTempUnit] = React.useState<ActiveOfficer | null>(null);

  function handleEditClick(officer: ActiveOfficer) {
    setTempUnit(officer);
    openModal(ModalIds.ManageUnit);
  }

  return (
    <div className="bg-gray-200/80 rounded-md overflow-hidden">
      <header className="bg-gray-300/50 px-4 p-2">
        <h3 className="text-xl font-semibold">{t("activeOfficers")}</h3>
      </header>

      <div className="px-4">
        {activeOfficers.length <= 0 ? (
          <p className="py-2">{t("noActiveOfficers")}</p>
        ) : (
          <div className="overflow-x-auto w-full mt-3 pb-2">
            <table className="overflow-hidden w-full whitespace-nowrap">
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
                {activeOfficers.map((officer) => (
                  <tr key={officer.id}>
                    <td>
                      {officer.callsign} {officer.name}
                    </td>
                    <td>{String(officer.badgeNumber)}</td>
                    <td>{officer.department.value}</td>
                    <td>{officer.division.value.value}</td>
                    <td>{officer.status?.value?.value}</td>
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

      {tempUnit ? <ManageUnitModal onClose={() => setTempUnit(null)} unit={tempUnit} /> : null}
    </div>
  );
};
