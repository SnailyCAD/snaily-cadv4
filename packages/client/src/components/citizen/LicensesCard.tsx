import * as React from "react";
import { useTranslations } from "use-intl";
import { Button } from "components/Button";
import { ModalIds } from "types/ModalIds";
import { useModal } from "context/ModalContext";
import { ManageLicensesModal } from "./modals/ManageLicensesModal";
import { useCitizen } from "context/CitizenContext";

export const LicensesCard = () => {
  const { openModal } = useModal();
  const t = useTranslations("Citizen");
  const { citizen } = useCitizen(false);

  const types = ["driversLicense", "weaponLicense", "pilotLicense", "ccw"] as const;

  return (
    <>
      <div className="bg-gray-200/60 p-4 rounded-md">
        <header className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Licenses</h1>

          <Button onClick={() => openModal(ModalIds.ManageLicenses)} small>
            Manage Licenses
          </Button>
        </header>

        <div>
          {types.map((type) => (
            <p key={type}>
              <span className="font-semibold">{t(type)}: </span> {citizen[type]}
            </p>
          ))}
        </div>
      </div>

      <ManageLicensesModal />
    </>
  );
};
