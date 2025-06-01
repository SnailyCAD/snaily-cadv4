import { Infofield } from "@snailycad/ui";
import { useAuth } from "context/AuthContext";
import { classNames } from "lib/classNames";
import { useNameSearch } from "state/search/name-search-state";
import { useTranslations } from "use-intl";

const licensePoints = [
  ["driverLicensePoints", "driversLicenseMaxPoints"],
  ["pilotLicensePoints", "pilotLicenseMaxPoints"],
  ["firearmsLicensePoints", "weaponLicenseMaxPoints"],
  ["waterLicensePoints", "waterLicenseMaxPoints"],
  ["huntingLicensePoints", "huntingLicenseMaxPoints"],
  ["fishingLicensePoints", "fishingLicenseMaxPoints"],
] as const;

export function LicensePointsSection() {
  const currentResult = useNameSearch((state) => state.currentResult);
  const t = useTranslations();
  const { cad } = useAuth();

  if (!currentResult || currentResult.isConfidential) {
    return null;
  }

  return (
    <ul>
      {licensePoints.map(([key, maxPointsKey]) => {
        const points = currentResult.licensePoints?.[key] ?? 0;
        const maxPoints = cad?.miscCadSettings?.[maxPointsKey] ?? 12;
        const color = points >= maxPoints && "text-red-400 font-semibold";

        return (
          <li key={key}>
            <Infofield
              childrenProps={{
                className: classNames(color),
              }}
              label={t(`Citizen.${key}`)}
            >
              {points ?? t("Common.none")}
            </Infofield>
          </li>
        );
      })}
    </ul>
  );
}
