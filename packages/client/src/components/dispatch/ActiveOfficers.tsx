import * as React from "react";
import { useTranslations } from "use-intl";
import { Button } from "components/Button";
import { useDispatchState } from "state/dispatchState";
import { ActiveOfficer } from "state/leoState";
import { ManageUnitModal } from "./modals/ManageUnit";
import { useModal } from "context/ModalContext";
import { ModalIds } from "types/ModalIds";

export const ActiveOfficers = () => {
  const { activeOfficers } = useDispatchState();
  const t = useTranslations("Leo");
  const common = useTranslations("Common");
  const { openModal } = useModal();

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
            <table className="overflow-hidden w-full whitespace-nowrap max-h-64">
              <thead>
                <tr>
                  <th>{t("officer")}</th>
                  <th>{t("badgeNumber")}</th>
                  <th>{t("department")}</th>
                  <th>{t("division")}</th>
                  <th>{t("status")}</th>
                  <th>{common("actions")}</th>
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
                    <td>{officer.status2?.value?.value}</td>
                    <td className="w-36">
                      <Button onClick={() => handleEditClick(officer)} small variant="success">
                        {common("manage")}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ManageUnitModal unit={tempUnit} />
    </div>
  );
};
