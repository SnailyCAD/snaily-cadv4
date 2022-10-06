import { Table, useTableState } from "components/shared/Table";
import { useTranslations } from "use-intl";
import { Button } from "@snailycad/ui";
import { useModal } from "state/modalState";
import { useNameSearch } from "state/search/nameSearchState";
import { ModalIds } from "types/ModalIds";

import { TabsContent } from "components/shared/TabList";
import type { Weapon } from "@snailycad/types";
import { useWeaponSearch } from "state/search/weaponSearchState";

export function NameSearchWeaponsTab() {
  const t = useTranslations();
  const common = useTranslations("Common");
  const { currentResult } = useNameSearch();
  const { openModal } = useModal();
  const { setCurrentResult: setWeaponResult } = useWeaponSearch();
  const tableState = useTableState();

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
          features={{ isWithinCard: true }}
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
          }))}
          columns={[
            {
              header: t("Weapons.model"),
              accessorKey: "model",
            },
            {
              header: t("Weapons.registrationStatus"),
              accessorKey: "registrationStatus",
            },
            {
              header: t("Weapons.serialNumber"),
              accessorKey: "serialNumber",
            },
          ]}
        />
      )}
    </TabsContent>
  );
}
