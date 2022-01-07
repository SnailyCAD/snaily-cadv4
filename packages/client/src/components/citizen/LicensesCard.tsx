import * as React from "react";
import { useTranslations } from "use-intl";
import { Button } from "components/Button";
import { ModalIds } from "types/ModalIds";
import { useModal } from "context/ModalContext";
import { ManageLicensesModal } from "./modals/ManageLicensesModal";
import { useCitizen } from "context/CitizenContext";
import { useFeatureEnabled } from "hooks/useFeatureEnabled";
import { Infofield } from "components/shared/Infofield";

export function LicensesCard() {
  const { openModal } = useModal();
  const t = useTranslations("Citizen");
  const common = useTranslations("Common");
  const { citizen } = useCitizen(false);
  const { WEAPON_REGISTRATION } = useFeatureEnabled();

  const types = ["driversLicense", "pilotLicense", "weaponLicense", "ccw"] as const;

  return (
    <>
      <div className="p-4 card">
        <header className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Licenses</h1>

          <Button onClick={() => openModal(ModalIds.ManageLicenses)} small>
            Manage Licenses
          </Button>
        </header>

        <div className="mt-2">
          {types.map((type) => {
            const category =
              type === "driversLicense"
                ? citizen.dlCategory.filter((v) => v.type === "AUTOMOTIVE")
                : type === "pilotLicense"
                ? citizen.dlCategory.filter((v) => v.type === "AVIATION")
                : null;

            const returnNull = ["weaponLicense", "ccw"].includes(type) && !WEAPON_REGISTRATION;

            if (returnNull) {
              return null;
            }

            return (
              <div key={type}>
                <Infofield label={t(type)}>{citizen[type]?.value ?? common("none")}</Infofield>

                {category && category.length > 0 ? (
                  <Infofield label={common("categories")} className="pl-3">
                    {category.map((v) => v?.value?.value).join(", ")}
                  </Infofield>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>

      <ManageLicensesModal />
    </>
  );
}
