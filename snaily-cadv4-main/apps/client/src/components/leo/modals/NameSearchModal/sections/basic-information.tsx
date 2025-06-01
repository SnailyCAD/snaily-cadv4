import { FullDate, Infofield } from "@snailycad/ui";
import { useAuth } from "context/AuthContext";
import { useFeatureEnabled } from "hooks/useFeatureEnabled";
import { calculateAge, formatCitizenAddress } from "lib/utils";
import { useNameSearch } from "state/search/name-search-state";
import { useTranslations } from "use-intl";
import { CustomFieldsArea } from "../../CustomFieldsArea";
import { useRouter } from "next/router";

export function NameSearchBasicInformation() {
  const currentResult = useNameSearch((state) => state.currentResult);
  const t = useTranslations();
  const { SOCIAL_SECURITY_NUMBERS } = useFeatureEnabled();
  const { cad, user } = useAuth();

  const router = useRouter();
  const isLeo = router.pathname === "/officer";

  if (!currentResult || currentResult.isConfidential) {
    return null;
  }

  return (
    <div className="w-full mb-6 md:mb-0">
      <div className="flex flex-col">
        {user?.developerMode ? (
          <Infofield label={t("Citizen.id")}>{currentResult.id}</Infofield>
        ) : null}

        <Infofield label={t("Citizen.fullName")}>
          {currentResult.name} {currentResult.surname}
        </Infofield>

        {SOCIAL_SECURITY_NUMBERS && currentResult.socialSecurityNumber ? (
          <Infofield label={t("Citizen.socialSecurityNumber")}>
            {currentResult.socialSecurityNumber}
          </Infofield>
        ) : null}

        <Infofield label={t("Citizen.dateOfBirth")}>
          <FullDate isDateOfBirth onlyDate>
            {currentResult.dateOfBirth}
          </FullDate>{" "}
          ({t("Citizen.age")}: {calculateAge(currentResult.dateOfBirth)})
        </Infofield>

        <Infofield label={t("Citizen.gender")}>
          {currentResult.gender?.value ?? t("Common.none")}
        </Infofield>
        <Infofield label={t("Citizen.ethnicity")}>
          {currentResult.ethnicity?.value ?? t("Common.none")}
        </Infofield>
        <Infofield label={t("Citizen.hairColor")}>{currentResult.hairColor}</Infofield>
        <Infofield label={t("Citizen.eyeColor")}>{currentResult.eyeColor}</Infofield>
      </div>

      <div className="flex flex-col">
        <Infofield label={t("Citizen.weight")}>
          {currentResult.weight} {cad?.miscCadSettings?.weightPrefix}
        </Infofield>

        <Infofield label={t("Citizen.height")}>
          {currentResult.height} {cad?.miscCadSettings?.heightPrefix}
        </Infofield>

        <Infofield label={t("Citizen.address")}>{formatCitizenAddress(currentResult)}</Infofield>

        <Infofield label={t("Citizen.phoneNumber")}>
          {currentResult.phoneNumber || t("Common.none")}
        </Infofield>

        <Infofield className="max-w-[400px]" label={t("Citizen.occupation")}>
          {currentResult.occupation || t("Common.none")}
        </Infofield>

        <Infofield className="max-w-[400px]" label={t("Citizen.additionalInfo")}>
          {currentResult.additionalInfo || t("Common.none")}
        </Infofield>
      </div>

      <CustomFieldsArea currentResult={currentResult} isLeo={isLeo} />
    </div>
  );
}
