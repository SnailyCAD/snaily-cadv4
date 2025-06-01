import { useTranslations } from "use-intl";
import { Button, FullDate, Infofield } from "@snailycad/ui";
import { ModalIds } from "types/modal-ids";
import { useModal } from "state/modalState";
import { type LicenseInitialValues, ManageLicensesModal } from "./manage-licenses-modal";
import { type CitizenWithVehAndWep, useCitizen } from "context/CitizenContext";
import { useFeatureEnabled } from "hooks/useFeatureEnabled";
import {
  type Citizen,
  DriversLicenseCategoryType,
  type SuspendedCitizenLicenses,
} from "@snailycad/types";
import useFetch from "lib/useFetch";
import type { PutCitizenLicensesByIdData } from "@snailycad/types/api";

const types = [
  "driversLicense",
  "pilotLicense",
  "waterLicense",
  "weaponLicense",
  "fishingLicense",
  "huntingLicense",
] as const;

export function LicensesCard() {
  const modalState = useModal();
  const { citizen, setCurrentCitizen } = useCitizen(false);
  const { ALLOW_CITIZEN_UPDATE_LICENSE, LICENSE_EXAMS, COMMON_CITIZEN_CARDS } = useFeatureEnabled();
  const t = useTranslations("Citizen");
  const { execute, state } = useFetch();
  const showManageLicensesButtonModal = !(LICENSE_EXAMS || !ALLOW_CITIZEN_UPDATE_LICENSE);

  async function onSubmit(values: LicenseInitialValues) {
    const { json } = await execute<PutCitizenLicensesByIdData>({
      path: `/licenses/${citizen.id}`,
      method: "PUT",
      data: values,
    });

    if (json?.id) {
      setCurrentCitizen({ ...citizen, ...json });
      modalState.closeModal(ModalIds.ManageLicenses);
    }
  }

  return (
    <div className="p-4 card">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{t("licenses")}</h1>

        {showManageLicensesButtonModal ? (
          <Button onPress={() => modalState.openModal(ModalIds.ManageLicenses)} size="xs">
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
    | "huntingLicense"
    | "fishingLicense"
    | "suspendedLicenses"
    | "pilotLicenseNumber"
    | "waterLicenseNumber"
    | "weaponLicenseNumber"
    | "driversLicenseNumber"
    | "fishingLicenseNumber"
    | "huntingLicenseNumber"
  >;
}

type SuspendedLicenseType = keyof Omit<SuspendedCitizenLicenses, "id">;
type LicenseNumbers = keyof Pick<
  Citizen,
  | "pilotLicenseNumber"
  | "waterLicenseNumber"
  | "weaponLicenseNumber"
  | "driversLicenseNumber"
  | "fishingLicenseNumber"
  | "huntingLicenseNumber"
>;

export function CitizenLicenses({ citizen }: Props) {
  const t = useTranslations();
  const common = useTranslations("Common");
  const { WEAPON_REGISTRATION } = useFeatureEnabled();

  const categoryTypes: Record<
    string,
    [DriversLicenseCategoryType, [SuspendedLicenseType, SuspendedLicenseType, LicenseNumbers]]
  > = {
    driversLicense: [
      DriversLicenseCategoryType.AUTOMOTIVE,
      ["driverLicense", "driverLicenseTimeEnd", "driversLicenseNumber"],
    ],
    pilotLicense: [
      DriversLicenseCategoryType.AVIATION,
      ["pilotLicense", "pilotLicenseTimeEnd", "pilotLicenseNumber"],
    ],
    waterLicense: [
      DriversLicenseCategoryType.WATER,
      ["waterLicense", "waterLicenseTimeEnd", "waterLicenseNumber"],
    ],
    weaponLicense: [
      DriversLicenseCategoryType.FIREARM,
      ["firearmsLicense", "firearmsLicenseTimeEnd", "weaponLicenseNumber"],
    ],
    fishingLicense: [
      DriversLicenseCategoryType.FISHING,
      ["fishingLicense", "fishingLicenseTimeEnd", "fishingLicenseNumber"],
    ],
    huntingLicense: [
      DriversLicenseCategoryType.HUNTING,
      ["huntingLicense", "huntingLicenseTimeEnd", "huntingLicenseNumber"],
    ],
  };

  const otherLicenseCategories = citizen.dlCategory.filter(
    (v) => v.type === DriversLicenseCategoryType.OTHER,
  );

  return (
    <>
      {types.map((type) => {
        const [categoryType, [suspendedType, suspendedTimeEndType, licenseNumberType]] =
          categoryTypes[type]!;

        const isSuspended = citizen.suspendedLicenses?.[suspendedType] ?? false;
        const category =
          categoryTypes[type] && citizen.dlCategory.filter((v) => v.type === categoryType);
        const licenseNumber = citizen[licenseNumberType];
        const suspendedTimeEnd = isSuspended && citizen.suspendedLicenses?.[suspendedTimeEndType];

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
                {typeof suspendedTimeEnd === "string" ? (
                  <span>
                    ({t("Leo.endsOn")} <FullDate onlyDate>{new Date(suspendedTimeEnd)}</FullDate>)
                  </span>
                ) : null}
              </Infofield>
            ) : (
              <>
                <Infofield label={t(`Citizen.${type}`)}>
                  {citizen[type]?.value ?? common("none")}
                </Infofield>

                {licenseNumber && citizen[type] ? (
                  <Infofield className="pl-3" label={t("Citizen.licenseNumber")}>
                    {licenseNumber}
                  </Infofield>
                ) : null}

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

      {otherLicenseCategories.length > 0 ? (
        <Infofield label={t("Citizen.otherLicenseCategory")}>
          {otherLicenseCategories.map((v) => v?.value?.value).join(", ")}
        </Infofield>
      ) : null}
    </>
  );
}
