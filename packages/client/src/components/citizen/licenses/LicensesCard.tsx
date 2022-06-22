import { useTranslations } from "use-intl";
import { Button } from "components/Button";
import { ModalIds } from "types/ModalIds";
import { useModal } from "state/modalState";
import { LicenseInitialValues, ManageLicensesModal } from "./ManageLicensesModal";
import { CitizenWithVehAndWep, useCitizen } from "context/CitizenContext";
import { useFeatureEnabled } from "hooks/useFeatureEnabled";
import { Infofield } from "components/shared/Infofield";
import { DriversLicenseCategoryType } from "@snailycad/types";
import useFetch from "lib/useFetch";

const types = ["driversLicense", "pilotLicense", "waterLicense", "weaponLicense"] as const;

export function LicensesCard() {
  const { openModal, closeModal } = useModal();
  const { citizen, setCurrentCitizen } = useCitizen(false);
  const { ALLOW_CITIZEN_UPDATE_LICENSE } = useFeatureEnabled();
  const t = useTranslations("Citizen");
  const { execute, state } = useFetch();

  async function onSubmit(values: LicenseInitialValues) {
    const { json } = await execute(`/licenses/${citizen.id}`, {
      method: "PUT",
      data: {
        ...values,
        driversLicenseCategory: values.driversLicenseCategory.map((v) => v.value),
        pilotLicenseCategory: values.pilotLicenseCategory.map((v) => v.value),
        waterLicenseCategory: values.waterLicenseCategory.map((v) => v.value),
        firearmLicenseCategory: values.firearmLicenseCategory.map((v) => v.value),
      },
    });

    if (json?.id) {
      setCurrentCitizen({ ...citizen, ...json });
      closeModal(ModalIds.ManageLicenses);
    }
  }

  return (
    <div className="p-4 card">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{t("licenses")}</h1>

        {ALLOW_CITIZEN_UPDATE_LICENSE ? (
          <Button onClick={() => openModal(ModalIds.ManageLicenses)} size="xs">
            {t("manageLicenses")}
          </Button>
        ) : null}
      </header>

      <div className="mt-2">
        <CitizenLicenses citizen={citizen} />
      </div>

      {ALLOW_CITIZEN_UPDATE_LICENSE ? (
        <ManageLicensesModal state={state} onSubmit={onSubmit} citizen={citizen} />
      ) : null}
    </div>
  );
}

interface Props {
  citizen: Pick<
    CitizenWithVehAndWep,
    "dlCategory" | "driversLicense" | "pilotLicense" | "weaponLicense" | "waterLicense"
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
    weaponLicense: DriversLicenseCategoryType.FIREARM,
  };

  return (
    <>
      {types.map((type) => {
        const category =
          categoryTypes[type] && citizen.dlCategory.filter((v) => v.type === categoryTypes[type]);

        const returnNull = type === "weaponLicense" && !WEAPON_REGISTRATION;
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
