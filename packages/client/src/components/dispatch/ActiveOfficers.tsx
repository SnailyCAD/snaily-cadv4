import { Button } from "components/Button";
import { useDispatchState } from "state/dispatchState";
import { useTranslations } from "use-intl";

export const ActiveOfficers = () => {
  const { activeOfficers } = useDispatchState();
  const t = useTranslations("Leo");
  const common = useTranslations("Common");

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
                  <th>{t("department")}</th>
                  <th>{t("division")}</th>
                  <th>{t("status")}</th>
                  <th>{common("actions")}</th>
                </tr>
              </thead>
              <tbody>
                {activeOfficers.map((vehicle) => (
                  <tr key={vehicle.id}>
                    <td>
                      {vehicle.callsign} {vehicle.name}
                    </td>
                    <td>{vehicle.department.value}</td>
                    <td>{vehicle.division.value.value}</td>
                    <td>{vehicle.status2.value?.value}</td>
                    <td className="w-36">
                      <Button small variant="success">
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

      {/* timeout: wait for modal to close */}
      {/* <>
        <ManageBoloModal onClose={() => setTimeout(() => setTempBolo(null), 100)} bolo={tempBolo} />

        <AlertModal
          title={"Delete Bolo"}
          onDeleteClick={handleDeleteBolo}
          description={"Are you sure you want to delete this bolo? This action cannot be undone"}
          id={ModalIds.AlertDeleteBolo}
          onClose={() => setTempBolo(null)}
          state={state}
        />
      </> */}
    </div>
  );
};
