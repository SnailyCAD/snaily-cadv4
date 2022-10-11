import * as React from "react";
import { Loader, Button, TextField } from "@snailycad/ui";
import type { Weapon } from "@snailycad/types";
import { ModalIds } from "types/ModalIds";
import { useModal } from "state/modalState";
import { RegisterWeaponModal } from "./RegisterWeaponModal";
import { useTranslations } from "use-intl";
import { AlertModal } from "components/modal/AlertModal";
import useFetch from "lib/useFetch";
import { Table, useTableState } from "components/shared/Table";
import { useFeatureEnabled } from "hooks/useFeatureEnabled";
import { FullDate } from "components/shared/FullDate";
import { useAsyncTable } from "hooks/shared/table/useAsyncTable";
import { useCitizen } from "context/CitizenContext";
import type { DeleteCitizenWeaponData, GetCitizenWeaponsData } from "@snailycad/types/api";
import { useTemporaryItem } from "hooks/shared/useTemporaryItem";

export function WeaponsCard(props: Pick<GetCitizenWeaponsData, "weapons">) {
  const { openModal, closeModal } = useModal();
  const { state, execute } = useFetch();
  const common = useTranslations("Common");
  const t = useTranslations("Weapons");
  const { WEAPON_REGISTRATION } = useFeatureEnabled();
  const { citizen } = useCitizen(false);

  const asyncTable = useAsyncTable({
    fetchOptions: {
      onResponse: (json: GetCitizenWeaponsData) => ({
        data: json.weapons,
        totalCount: json.totalCount,
      }),
      path: `/weapons/${citizen.id}`,
    },
    totalCount: props.weapons.length,
    initialData: props.weapons,
  });
  const tableState = useTableState({ pagination: { ...asyncTable.pagination, pageSize: 12 } });
  const [tempWeapon, weaponState] = useTemporaryItem(asyncTable.data);

  async function handleDelete() {
    if (!tempWeapon) return;

    const { json } = await execute<DeleteCitizenWeaponData>({
      path: `/weapons/${tempWeapon.id}`,
      method: "DELETE",
    });

    if (typeof json === "boolean" && json) {
      const newData = asyncTable.data.filter((v) => v.id !== tempWeapon.id);

      if (newData.length <= 0) {
        props.weapons.length = 0;
      }

      asyncTable.setData(newData);
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

        {asyncTable.data.length <= 0 ? (
          <p className="text-neutral-700 dark:text-gray-400">{t("noWeapons")}</p>
        ) : (
          <>
            <TextField
              label={common("search")}
              className="w-full relative"
              name="search"
              onChange={asyncTable.search.setSearch}
              value={asyncTable.search.search}
              placeholder="Serial Number, Model, ..."
            >
              {asyncTable.search.state === "loading" ? (
                <span className="absolute top-[2.4rem] right-2.5">
                  <Loader />
                </span>
              ) : null}
            </TextField>

            {asyncTable.search.search &&
            asyncTable.pagination.totalDataCount !== props.weapons.length ? (
              <p className="italic text-base font-semibold">
                Showing {asyncTable.pagination.totalDataCount} result(s)
              </p>
            ) : null}

            <Table
              tableState={tableState}
              features={{ isWithinCard: true }}
              data={asyncTable.data.map((weapon) => ({
                id: weapon.id,
                model: weapon.model.value.value,
                registrationStatus: weapon.registrationStatus.value,
                serialNumber: weapon.serialNumber,
                createdAt: <FullDate>{weapon.createdAt}</FullDate>,
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
                { header: common("createdAt"), accessorKey: "createdAt" },
                { header: common("actions"), accessorKey: "actions" },
              ]}
            />
          </>
        )}
      </div>

      <RegisterWeaponModal
        onCreate={(weapon) => {
          closeModal(ModalIds.RegisterWeapon);
          asyncTable.setData((p) => [...p, weapon]);
          props.weapons.length += 1;
        }}
        onUpdate={(old, newW) => {
          asyncTable.setData((p) => {
            const idx = p.indexOf(old);
            p[idx] = newW;
            return p;
          });
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
