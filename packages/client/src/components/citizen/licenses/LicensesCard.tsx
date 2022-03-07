import { useTranslations } from "use-intl";
import { Button } from "components/Button";
import { ModalIds } from "types/ModalIds";
import { useModal } from "context/ModalContext";
import { ManageLicensesModal } from "./ManageLicensesModal";
import { CitizenWithVehAndWep, useCitizen } from "context/CitizenContext";
import { useFeatureEnabled } from "hooks/useFeatureEnabled";
import { Infofield } from "components/shared/Infofield";
import { DriversLicenseCategoryType } from "@snailycad/types";

const types = ["driversLicense", "pilotLicense", "weaponLicense", "waterLicense", "ccw"] as const;

export function LicensesCard() {
  const { openModal } = useModal();
  const { citizen } = useCitizen(false);
  const { ALLOW_CITIZEN_UPDATE_LICENSE } = useFeatureEnabled();
  const t = useTranslations("Citizen");

  return (
    <div className="p-4 card">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{t("licenses")}</h1>

        {ALLOW_CITIZEN_UPDATE_LICENSE ? (
          <Button onClick={() => openModal(ModalIds.ManageLicenses)} small>
            {t("manageLicenses")}
          </Button>
        ) : null}
      </header>

      <div className="mt-2">
        <CitizenLicenses citizen={citizen} />
      </div>

      {ALLOW_CITIZEN_UPDATE_LICENSE ? <ManageLicensesModal /> : null}
    </div>
  );
}

interface Props {
  citizen: Pick<
    CitizenWithVehAndWep,
    "dlCategory" | "driversLicense" | "pilotLicense" | "weaponLicense" | "ccw" | "waterLicense"
  >;
}

export function CitizenLicenses({ citizen }: Props) {
  const t = useTranslations("Citizen");
  const common = useTranslations("Common");
  const { WEAPON_REGISTRATION } = useFeatureEnabled();

  const categoryTypes: Record<string, DriversLicenseCategoryType> = {
    driversLicense: DriversLicenseCategoryType.AUTOMOTIVE,
    pilotLicense: DriversLicenseCategoryType.AVIATION,
    waterLicense: DriversLicenseCategoryType.WATER,
  };

  console.log({ citizen });

  return (
    <>
      {types.map((type) => {
        const category =
          categoryTypes[type] && citizen.dlCategory.filter((v) => v.type === categoryTypes[type]);

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
    </>
  );
}
