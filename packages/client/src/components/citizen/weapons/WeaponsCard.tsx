import * as React from "react";
import { Button } from "components/Button";
import type { Weapon } from "@snailycad/types";
import { ModalIds } from "types/ModalIds";
import { useModal } from "state/modalState";
import { RegisterWeaponModal } from "./RegisterWeaponModal";
import { useTranslations } from "use-intl";
import { AlertModal } from "components/modal/AlertModal";
import useFetch from "lib/useFetch";
import { Table } from "components/shared/Table";
import { useFeatureEnabled } from "hooks/useFeatureEnabled";
import { FullDate } from "components/shared/FullDate";
import { useAsyncTable } from "hooks/shared/table/useAsyncTable";
import { useCitizen } from "context/CitizenContext";
import { FormField } from "components/form/FormField";
import { Input } from "components/form/inputs/Input";
import { Loader } from "components/Loader";

export function WeaponsCard(props: { weapons: Weapon[] }) {
  const { openModal, closeModal } = useModal();
  const { state, execute } = useFetch();
  const common = useTranslations("Common");
  const t = useTranslations("Weapons");
  const { WEAPON_REGISTRATION } = useFeatureEnabled();
  const { citizen } = useCitizen(false);

  const [tempWeapon, setTempWeapon] = React.useState<Weapon | null>(null);
  const asyncTable = useAsyncTable({
    fetchOptions: {
      onResponse: (json) => ({ data: json.weapons, totalCount: json.totalCount }),
      path: `/weapons/${citizen.id}`,
    },
    totalCount: props.weapons.length,
    initialData: props.weapons,
  });

  async function handleDelete() {
    if (!tempWeapon) return;

    const { json } = await execute(`/weapons/${tempWeapon.id}`, {
      method: "DELETE",
    });

    if (json) {
      asyncTable.setData((p) => p.filter((v) => v.id !== tempWeapon.id));
      setTempWeapon(null);
      closeModal(ModalIds.AlertDeleteWeapon);
    }
  }

  function handleEditClick(weapon: Weapon) {
    setTempWeapon(weapon);
    openModal(ModalIds.RegisterWeapon);
  }

  function handleDeleteClick(weapon: Weapon) {
    setTempWeapon(weapon);
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

          <Button onClick={() => openModal(ModalIds.RegisterWeapon)} size="xs">
            {t("addWeapon")}
          </Button>
        </header>

        {asyncTable.data.length <= 0 ? (
          <p className="text-neutral-700 dark:text-gray-400">{t("noWeapons")}</p>
        ) : (
          <>
            {/* todo: make this a component */}
            <FormField label={common("search")} className="w-full relative">
              <Input
                placeholder="john doe"
                onChange={(e) => asyncTable.search.setSearch(e.target.value)}
                value={asyncTable.search.search}
              />
              {asyncTable.state === "loading" ? (
                <span className="absolute top-[2.4rem] right-2.5">
                  <Loader />
                </span>
              ) : null}
            </FormField>

            {asyncTable.search.search &&
            asyncTable.pagination.totalCount !== props.weapons.length ? (
              <p className="italic text-base font-semibold">
                Showing {asyncTable.pagination.totalCount} result(s)
              </p>
            ) : null}

            <Table
              isWithinCard
              maxItemsPerPage={12}
              pagination={{
                enabled: true,
                totalCount: asyncTable.pagination.totalCount,
                fetchData: asyncTable.pagination,
              }}
              data={asyncTable.data.map((weapon) => ({
                model: weapon.model.value.value,
                registrationStatus: weapon.registrationStatus.value,
                serialNumber: weapon.serialNumber,
                createdAt: <FullDate>{weapon.createdAt}</FullDate>,
                actions: (
                  <>
                    <Button onClick={() => handleEditClick(weapon)} size="xs" variant="success">
                      {common("edit")}
                    </Button>
                    <Button
                      className="ml-2"
                      onClick={() => handleDeleteClick(weapon)}
                      size="xs"
                      variant="danger"
                    >
                      {common("delete")}
                    </Button>
                  </>
                ),
              }))}
              columns={[
                { Header: t("model"), accessor: "model" },
                { Header: t("registrationStatus"), accessor: "registrationStatus" },
                { Header: t("serialNumber"), accessor: "serialNumber" },
                { Header: common("createdAt"), accessor: "createdAt" },
                { Header: common("actions"), accessor: "actions" },
              ]}
            />
          </>
        )}
      </div>

      <RegisterWeaponModal
        onCreate={(weapon) => {
          closeModal(ModalIds.RegisterWeapon);
          asyncTable.setData((p) => [...p, weapon]);
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
        onClose={() => setTempWeapon(null)}
      />

      <AlertModal
        className="w-[600px]"
        title={t("deleteWeapon")}
        id={ModalIds.AlertDeleteWeapon}
        description={t("alert_deleteWeapon")}
        onDeleteClick={handleDelete}
        state={state}
        onClose={() => setTempWeapon(null)}
      />
    </>
  );
}
