import { useTranslations } from "use-intl";
import { Button } from "@snailycad/ui";
import { ModalIds } from "types/ModalIds";
import { useModal } from "state/modalState";
import { LicenseInitialValues, ManageLicensesModal } from "./ManageLicensesModal";
import { CitizenWithVehAndWep, useCitizen } from "context/CitizenContext";
import { useFeatureEnabled } from "hooks/useFeatureEnabled";
import { Infofield } from "components/shared/Infofield";
import { DriversLicenseCategoryType, SuspendedCitizenLicenses } from "@snailycad/types";
import useFetch from "lib/useFetch";
import type { PutCitizenLicensesByIdData } from "@snailycad/types/api";

const types = ["driversLicense", "pilotLicense", "waterLicense", "weaponLicense"] as const;

export function LicensesCard() {
  const { openModal, closeModal } = useModal();
  const { citizen, setCurrentCitizen } = useCitizen(false);
  const { ALLOW_CITIZEN_UPDATE_LICENSE, LICENSE_EXAMS, COMMON_CITIZEN_CARDS } = useFeatureEnabled();
  const t = useTranslations("Citizen");
  const { execute, state } = useFetch();
  const showManageLicensesButtonModal = !(LICENSE_EXAMS || !ALLOW_CITIZEN_UPDATE_LICENSE);

  async function onSubmit(values: LicenseInitialValues) {
    const { json } = await execute<PutCitizenLicensesByIdData>({
      path: `/licenses/${citizen.id}`,
      method: "PUT",
      data: {
        ...values,
        driversLicenseCategory: values.driversLicenseCategory?.map((v) => v.value),
        pilotLicenseCategory: values.pilotLicenseCategory?.map((v) => v.value),
        waterLicenseCategory: values.waterLicenseCategory?.map((v) => v.value),
        firearmLicenseCategory: values.firearmLicenseCategory?.map((v) => v.value),
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

        {showManageLicensesButtonModal ? (
          <Button onPress={() => openModal(ModalIds.ManageLicenses)} size="xs">
            {t("manageLicenses")}
          </Button>
        ) : null}
      </header>

      <div className="mt-2">
        <CitizenLicenses citizen={citizen} />
      </div>

      {showManageLicensesButtonModal ? (
        <ManageLicensesModal
          isLeo={COMMON_CITIZEN_CARDS}
          state={state}
          onSubmit={onSubmit}
          citizen={citizen}
        />
      ) : null}
    </div>
  );
}

interface Props {
  citizen: Pick<
    CitizenWithVehAndWep,
    | "dlCategory"
    | "driversLicense"
    | "pilotLicense"
    | "weaponLicense"
    | "waterLicense"
    | "suspendedLicenses"
  >;
}

type SuspendedLicenseType = keyof Omit<SuspendedCitizenLicenses, "id">;
export function CitizenLicenses({ citizen }: Props) {
  const t = useTranslations();
  const common = useTranslations("Common");
  const { WEAPON_REGISTRATION } = useFeatureEnabled();

  const categoryTypes: Record<string, [DriversLicenseCategoryType, SuspendedLicenseType]> = {
    driversLicense: [DriversLicenseCategoryType.AUTOMOTIVE, "driverLicense"],
    pilotLicense: [DriversLicenseCategoryType.AVIATION, "pilotLicense"],
    waterLicense: [DriversLicenseCategoryType.WATER, "waterLicense"],
    weaponLicense: [DriversLicenseCategoryType.FIREARM, "firearmsLicense"],
  };

  return (
    <>
      {types.map((type) => {
        const [categoryType, suspendedType] = categoryTypes[type] as [
          DriversLicenseCategoryType,
          SuspendedLicenseType,
        ];

        const isSuspended = citizen.suspendedLicenses?.[suspendedType] ?? false;
        const category =
          categoryTypes[type] && citizen.dlCategory.filter((v) => v.type === categoryType);

        const returnNull = type === "weaponLicense" && !WEAPON_REGISTRATION;
        if (returnNull) {
          return null;
        }

        return (
          <div key={type}>
            {isSuspended ? (
              <Infofield
                childrenProps={{ className: "text-red-700 font-semibold" }}
                label={t(`Citizen.${type}`)}
              >
                {t("Leo.suspended")}
              </Infofield>
            ) : (
              <>
                <Infofield label={t(`Citizen.${type}`)}>
                  {citizen[type]?.value ?? common("none")}
                </Infofield>

                {category && category.length > 0 ? (
                  <Infofield label={common("categories")} className="pl-3">
                    {category.map((v) => v?.value?.value).join(", ")}
                  </Infofield>
                ) : null}
              </>
            )}
          </div>
        );
      })}
    </>
  );
}
