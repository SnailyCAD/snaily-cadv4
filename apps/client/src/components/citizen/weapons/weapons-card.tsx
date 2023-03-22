import * as React from "react";
import { Button } from "@snailycad/ui";
import type { Weapon } from "@snailycad/types";
import { ModalIds } from "types/ModalIds";
import { useModal } from "state/modalState";
import { RegisterWeaponModal } from "./register-weapon-modal";
import { useTranslations } from "use-intl";
import { AlertModal } from "components/modal/AlertModal";
import useFetch from "lib/useFetch";
import { Table, useTableState } from "components/shared/Table";
import { useFeatureEnabled } from "hooks/useFeatureEnabled";
import { FullDate } from "components/shared/FullDate";
import { useAsyncTable } from "hooks/shared/table/use-async-table";
import { useCitizen } from "context/CitizenContext";
import type { DeleteCitizenWeaponData, GetCitizenWeaponsData } from "@snailycad/types/api";
import { useTemporaryItem } from "hooks/shared/useTemporaryItem";
import { SearchArea } from "components/shared/search/search-area";
import { Status } from "components/shared/Status";

export function WeaponsCard(props: Pick<GetCitizenWeaponsData, "weapons">) {
  const [search, setSearch] = React.useState("");

  const { openModal, closeModal } = useModal();
  const { state, execute } = useFetch();
  const common = useTranslations("Common");
  const t = useTranslations("Weapons");
  const { WEAPON_REGISTRATION, BUREAU_OF_FIREARMS } = useFeatureEnabled();
  const { citizen } = useCitizen(false);

  const asyncTable = useAsyncTable({
    search,
    scrollToTopOnDataChange: false,
    fetchOptions: {
      pageSize: 12,
      onResponse: (json: GetCitizenWeaponsData) => ({
        data: json.weapons,
        totalCount: json.totalCount,
      }),
      path: `/weapons/${citizen.id}`,
    },
    totalCount: props.weapons.length,
    initialData: props.weapons,
  });
  const tableState = useTableState({ pagination: asyncTable.pagination });
  const [tempWeapon, weaponState] = useTemporaryItem(asyncTable.items);

  async function handleDelete() {
    if (!tempWeapon) return;

    const { json } = await execute<DeleteCitizenWeaponData>({
      path: `/weapons/${tempWeapon.id}`,
      method: "DELETE",
    });

    if (typeof json === "boolean" && json) {
      asyncTable.remove(tempWeapon.id);
      weaponState.setTempId(null);
      closeModal(ModalIds.AlertDeleteWeapon);
    }
  }

  function handleEditClick(weapon: Omit<Weapon, "citizen">) {
    weaponState.setTempId(weapon.id);
    openModal(ModalIds.RegisterWeapon);
  }

  function handleDeleteClick(weapon: Omit<Weapon, "citizen">) {
    weaponState.setTempId(weapon.id);
    openModal(ModalIds.AlertDeleteWeapon);
  }

  // weapon registration is disabled, don't bother showing this card.
  if (!WEAPON_REGISTRATION) {
    return null;
  }

  return (
    <>
      <div className="p-4 card">
        <header className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">{t("yourWeapons")}</h1>

          <Button onPress={() => openModal(ModalIds.RegisterWeapon)} size="xs">
            {t("addWeapon")}
          </Button>
        </header>

        <SearchArea
          asyncTable={asyncTable}
          search={{ search, setSearch }}
          totalCount={props.weapons.length}
        />

        {!search && asyncTable.items.length <= 0 ? (
          <p className="text-neutral-700 dark:text-gray-400">{t("noWeapons")}</p>
        ) : (
          <Table
            tableState={tableState}
            features={{ isWithinCardOrModal: true }}
            data={asyncTable.items.map((weapon) => ({
              id: weapon.id,
              model: weapon.model.value.value,
              registrationStatus: weapon.registrationStatus.value,
              serialNumber: weapon.serialNumber,
              bofStatus: <Status fallback="—">{weapon.bofStatus}</Status>,
              createdAt: <FullDate onlyDate>{weapon.createdAt}</FullDate>,
              actions: (
                <>
                  <Button onPress={() => handleEditClick(weapon)} size="xs" variant="success">
                    {common("edit")}
                  </Button>
                  <Button
                    className="ml-2"
                    onPress={() => handleDeleteClick(weapon)}
                    size="xs"
                    variant="danger"
                  >
                    {common("delete")}
                  </Button>
                </>
              ),
            }))}
            columns={[
              { header: t("model"), accessorKey: "model" },
              { header: t("registrationStatus"), accessorKey: "registrationStatus" },
              { header: t("serialNumber"), accessorKey: "serialNumber" },
              BUREAU_OF_FIREARMS ? { header: t("bofStatus"), accessorKey: "bofStatus" } : null,
              { header: common("createdAt"), accessorKey: "createdAt" },
              { header: common("actions"), accessorKey: "actions" },
            ]}
          />
        )}
      </div>

      <RegisterWeaponModal
        onCreate={(weapon) => {
          closeModal(ModalIds.RegisterWeapon);
          asyncTable.append(weapon);
        }}
        onUpdate={(previousWeapon, newWeapon) => {
          asyncTable.update(previousWeapon.id, newWeapon);
          closeModal(ModalIds.RegisterWeapon);
        }}
        weapon={tempWeapon}
        onClose={() => weaponState.setTempId(null)}
      />

      <AlertModal
        className="w-[600px]"
        title={t("deleteWeapon")}
        id={ModalIds.AlertDeleteWeapon}
        description={t("alert_deleteWeapon")}
        onDeleteClick={handleDelete}
        state={state}
        onClose={() => weaponState.setTempId(null)}
      />
    </>
  );
}
