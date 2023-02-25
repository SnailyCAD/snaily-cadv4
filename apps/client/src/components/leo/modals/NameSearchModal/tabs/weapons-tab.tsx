import { Table, useTableState } from "components/shared/Table";
import { useTranslations } from "use-intl";
import { Button, TabsContent } from "@snailycad/ui";
import { useModal } from "state/modalState";
import { useNameSearch } from "state/search/name-search-state";
import { ModalIds } from "types/ModalIds";

import type { Weapon } from "@snailycad/types";
import { useWeaponSearch } from "state/search/weapon-search-state";
import { useFeatureEnabled } from "hooks/useFeatureEnabled";
import { Status } from "components/shared/Status";

export function NameSearchWeaponsTab() {
  const t = useTranslations();
  const common = useTranslations("Common");
  const currentResult = useNameSearch((state) => state.currentResult);
  const { openModal } = useModal();
  const setWeaponResult = useWeaponSearch((state) => state.setCurrentResult);
  const tableState = useTableState();
  const { BUREAU_OF_FIREARMS } = useFeatureEnabled();

  function handleWeaponPress(weapon: Weapon) {
    if (!currentResult || currentResult.isConfidential) return;

    // todo: set correct data for `allCustomFields` and `customFields`
    setWeaponResult({ allCustomFields: [], customFields: [], ...weapon, citizen: currentResult });
    openModal(ModalIds.WeaponSearchWithinName);
  }

  if (!currentResult || currentResult.isConfidential) {
    return null;
  }

  return (
    <TabsContent value="weapons">
      <h3 className="text-xl font-semibold">{t("Weapons.registeredWeapons")}</h3>

      {currentResult.weapons.length <= 0 ? (
        <p className="text-neutral-700 dark:text-gray-400 my-2">{t("Leo.noWeaponsCitizen")}</p>
      ) : (
        <Table
          features={{ isWithinCardOrModal: true }}
          tableState={tableState}
          data={currentResult.weapons.map((weapon) => ({
            id: weapon.id,
            model: (
              <Button
                title={common("openInSearch")}
                size="xs"
                type="button"
                onPress={() => handleWeaponPress(weapon)}
              >
                {weapon.model.value.value}
              </Button>
            ),
            registrationStatus: weapon.registrationStatus.value,
            serialNumber: weapon.serialNumber,
            bofStatus: <Status fallback="—">{weapon.bofStatus}</Status>,
          }))}
          columns={[
            { header: t("Weapons.model"), accessorKey: "model" },
            { header: t("Weapons.registrationStatus"), accessorKey: "registrationStatus" },
            { header: t("Weapons.serialNumber"), accessorKey: "serialNumber" },
            BUREAU_OF_FIREARMS
              ? { header: t("Weapons.bofStatus"), accessorKey: "bofStatus" }
              : null,
          ]}
        />
      )}
    </TabsContent>
  );
}
