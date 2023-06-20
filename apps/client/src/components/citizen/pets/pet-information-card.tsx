import { FullDate, Infofield } from "@snailycad/ui";
import { useAuth } from "context/AuthContext";
import { calculateAge } from "lib/utils";
import { usePetsState } from "state/citizen/pets-state";
import { useTranslations } from "use-intl";

export function PetInformationCard() {
  const t = useTranslations("Pets");
  const { cad } = useAuth();
  const { currentPet } = usePetsState();

  if (!currentPet) {
    return null;
  }

  return (
    <div className="flex items-start justify-between p-4 card">
      <section className="flex flex-col items-start sm:flex-row">
        <div className="flex flex-col mt-2 sm:ml-4 sm:mt-0">
          <Infofield label={t("name")}>{currentPet.name}</Infofield>

          <Infofield label={t("dateOfBirth")}>
            <FullDate isDateOfBirth onlyDate>
              {currentPet.dateOfBirth}
            </FullDate>{" "}
            ({t("age")}: {calculateAge(currentPet.dateOfBirth)})
          </Infofield>
          <Infofield label={t("breed")}>{currentPet.breed}</Infofield>
          <Infofield label={t("color")}>{currentPet.color}</Infofield>
        </div>

        <div className="flex flex-col sm:ml-5">
          <Infofield label={t("weight")}>
            {currentPet.weight} {cad?.miscCadSettings?.weightPrefix}
          </Infofield>

          <Infofield className="max-w-[400px]" label={t("citizen")}>
            {currentPet.citizen.name} {currentPet.citizen.surname}
          </Infofield>
        </div>
      </section>
    </div>
  );
}
