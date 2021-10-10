/* eslint-disable */
// TODO ^
import * as React from "react";
import { Button } from "components/Button";
import { Weapon } from "types/prisma";
import { useModal } from "context/ModalContext";
import { useTranslations } from "use-intl";
import useFetch from "lib/useFetch";

export const ViolationsCard = (props: { weapons: Weapon[] }) => {
  const { openModal, closeModal } = useModal();
  const common = useTranslations("Common");
  const t = useTranslations("Violations");

  const [violations, setViolations] = React.useState<Weapon[]>(props.weapons);
  const [tempValue, setTempValue] = React.useState<Weapon | null>(null);

  function handleViewClick(weapon: Weapon) {
    setTempValue(weapon);
  }

  return (
    <>
      <div className="bg-gray-200/60 p-4 rounded-md">
        <header className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">{t("violations")}</h1>
        </header>

        {violations.length <= 0 ? (
          <p className="text-gray-600">{t("noViolations")}</p>
        ) : (
          <div className="overflow-x-auto w-full">
            <table className="table-auto max-h-64 mt-3">
              <thead>
                <tr>
                  <th>{common("type")}</th>
                  <th>{t("registrationStatus")}</th>
                  <th>{common("actions")}</th>
                </tr>
              </thead>
              <tbody>
                {violations.map((weapon) => (
                  <tr key={weapon.id}>
                    <td>{weapon.model}</td>
                    <td>{weapon.registrationStatus}</td>
                    <td className="w-[30%]">
                      <Button onClick={() => handleViewClick(weapon)} small>
                        {common("view")}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
};
