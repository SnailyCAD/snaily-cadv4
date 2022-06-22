import * as React from "react";
import { Button } from "components/Button";
import type { Citizen, Weapon } from "@snailycad/types";
import { ModalIds } from "types/ModalIds";
import { useModal } from "state/modalState";
import { RegisterWeaponModal } from "./RegisterWeaponModal";
import { useTranslations } from "use-intl";
import { AlertModal } from "components/modal/AlertModal";
import useFetch from "lib/useFetch";
import { Table } from "components/shared/Table";
import { useFeatureEnabled } from "hooks/useFeatureEnabled";
import { FullDate } from "components/shared/FullDate";

export function WeaponsCard(props: { weapons: (Weapon & { citizen: Citizen })[] }) {
  const { openModal, closeModal } = useModal();
  const { state, execute } = useFetch();
  const common = useTranslations("Common");
  const t = useTranslations("Weapons");
  const { WEAPON_REGISTRATION } = useFeatureEnabled();

  const [weapons, setWeapons] = React.useState<(Weapon & { citizen: Citizen })[]>(props.weapons);
  const [tempWeapon, setTempWeapon] = React.useState<(Weapon & { citizen: Citizen }) | null>(null);

  React.useEffect(() => {
    setWeapons(props.weapons);
  }, [props.weapons]);

  async function handleDelete() {
    if (!tempWeapon) return;

    const { json } = await execute(`/weapons/${tempWeapon.id}`, {
      method: "DELETE",
    });

    if (json) {
      setWeapons((p) => p.filter((v) => v.id !== tempWeapon.id));
      setTempWeapon(null);
      closeModal(ModalIds.AlertDeleteWeapon);
    }
  }

  function handleEditClick(weapon: Weapon & { citizen: Citizen }) {
    setTempWeapon(weapon);
    openModal(ModalIds.RegisterWeapon);
  }

  function handleDeleteClick(weapon: Weapon & { citizen: Citizen }) {
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

        {weapons.length <= 0 ? (
          <p className="text-neutral-700 dark:text-gray-400">{t("noWeapons")}</p>
        ) : (
          <Table
            isWithinCard
            data={weapons.map((weapon) => ({
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
        )}
      </div>

      <RegisterWeaponModal
        onCreate={(weapon) => {
          closeModal(ModalIds.RegisterWeapon);
          setWeapons((p) => [...p, weapon]);
        }}
        onUpdate={(old, newW) => {
          setWeapons((p) => {
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
