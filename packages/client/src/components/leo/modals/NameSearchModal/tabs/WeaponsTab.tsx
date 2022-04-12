import { Table } from "components/shared/Table";
import { useTranslations } from "use-intl";
import { Button } from "components/Button";
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

  function handleWeaponClick(weapon: Weapon) {
    if (!currentResult) return;

    // todo: set correct data for `allCustomFields` and `customFields`
    setWeaponResult({ ...weapon, allCustomFields: [], customFields: [], citizen: currentResult });
    openModal(ModalIds.WeaponSearch);
  }

  if (!currentResult) {
    return null;
  }

  return (
    <TabsContent value="weapons">
      <h3 className="text-xl font-semibold">{t("Weapons.registeredWeapons")}</h3>

      {currentResult.weapons.length <= 0 ? (
        <p className="text-gray-400 my-2">{t("Leo.noWeaponsCitizen")}</p>
      ) : (
        <Table
          data={currentResult.weapons.map((weapon) => ({
            model: (
              <Button
                title={common("openInSearch")}
                small
                type="button"
                onClick={() => handleWeaponClick(weapon)}
              >
                {weapon.model.value.value}
              </Button>
            ),
            registrationStatus: weapon.registrationStatus.value,
            serialNumber: weapon.serialNumber,
          }))}
          columns={[
            {
              Header: t("Weapons.model"),
              accessor: "model",
            },
            {
              Header: t("Weapons.registrationStatus"),
              accessor: "registrationStatus",
            },
            {
              Header: t("Weapons.serialNumber"),
              accessor: "serialNumber",
            },
          ]}
        />
      )}
    </TabsContent>
  );
}
