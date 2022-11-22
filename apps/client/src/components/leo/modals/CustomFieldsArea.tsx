import { Button } from "@snailycad/ui";
import { Infofield } from "components/shared/Infofield";
import { useModal } from "state/modalState";
import { useTranslations } from "next-intl";
import type { NameSearchResult } from "state/search/name-search-state";
import type { VehicleSearchResult } from "state/search/vehicle-search-state";
import type { WeaponSearchResult } from "state/search/weapon-search-state";
import { ModalIds } from "types/ModalIds";

interface Props {
  currentResult: NonNullable<NameSearchResult | VehicleSearchResult | WeaponSearchResult>;
  isLeo: boolean;
}

export function CustomFieldsArea({ currentResult, isLeo }: Props) {
  const { openModal } = useModal();
  const t = useTranslations("Leo");
  const common = useTranslations("Common");

  if ("isConfidential" in currentResult && currentResult.isConfidential) {
    return null;
  }

  if (!currentResult.allCustomFields || !currentResult.customFields) {
    return null;
  }

  return currentResult.allCustomFields.length <= 0 ? null : (
    <li className="mt-4 list-none">
      <h4 className="font-semibold text-lg text-neutral-700 dark:text-gray-300/75">
        {t("otherFields")}
      </h4>

      {currentResult.customFields.length <= 0 ? (
        <p>{common("none")}</p>
      ) : (
        currentResult.customFields.map((v) => (
          <Infofield label={v.field.name} key={v.id}>
            {v.value || "—"}
          </Infofield>
        ))
      )}

      {isLeo ? (
        <Button
          size="xs"
          type="button"
          className="mt-2"
          onPress={() => openModal(ModalIds.ManageCitizenCustomFields)}
        >
          {t("manageCustomFields")}
        </Button>
      ) : null}
    </li>
  );
}
