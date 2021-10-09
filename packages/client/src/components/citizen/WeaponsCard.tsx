import * as React from "react";
import { Button } from "components/Button";
import { Weapon } from "types/prisma";
import { ModalIds } from "types/ModalIds";
import { useModal } from "context/ModalContext";
import { RegisterWeaponModal } from "./RegisterWeaponModal";
import { useTranslations } from "use-intl";
import { AlertModal } from "components/modal/AlertModal";
import useFetch from "lib/useFetch";

export const WeaponsCard = (props: { weapons: Weapon[] }) => {
  const { openModal, closeModal } = useModal();
  const { state, execute } = useFetch();
  const common = useTranslations("Common");
  const t = useTranslations("Weapons");

  const [weapons, setWeapons] = React.useState<Weapon[]>(props.weapons);
  const [tempWeapon, setTempWeapon] = React.useState<Weapon | null>(null);

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

  function handleEditClick(weapon: Weapon) {
    setTempWeapon(weapon);
    openModal(ModalIds.RegisterWeapon);
  }

  function handleDeleteClick(weapon: Weapon) {
    setTempWeapon(weapon);
    openModal(ModalIds.AlertDeleteWeapon);
  }

  return (
    <>
      <div className="bg-gray-200/60 p-4 rounded-md">
        <header className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">{t("yourWeapons")}</h1>

          <Button onClick={() => openModal(ModalIds.RegisterWeapon)} small>
            {t("addWeapon")}
          </Button>
        </header>

        {weapons.length <= 0 ? (
          <p className="text-gray-600">{t("noWeapons")}</p>
        ) : (
          <div className="overflow-x-auto w-full">
            <table className="table-auto max-h-64 mt-3">
              <thead>
                <tr>
                  <th>{t("model")}</th>
                  <th>{t("registrationStatus")}</th>
                  <th>{common("actions")}</th>
                </tr>
              </thead>
              <tbody>
                {weapons.map((weapon) => (
                  <tr key={weapon.id}>
                    <td>{weapon.model}</td>
                    <td>{weapon.registrationStatus}</td>
                    <td className="w-[30%]">
                      <Button onClick={() => handleEditClick(weapon)} small variant="success">
                        {common("edit")}
                      </Button>
                      <Button
                        className="ml-2"
                        onClick={() => handleDeleteClick(weapon)}
                        small
                        variant="danger"
                      >
                        {common("delete")}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
        citizens={[]}
        onClose={() => setTempWeapon(null)}
      />

      <AlertModal
        className="min-w-[600px]"
        title={t("deleteWeapon")}
        id={ModalIds.AlertDeleteWeapon}
        description={t("alert_deleteWeapon")}
        onDeleteClick={handleDelete}
        state={state}
        onClose={() => setTempWeapon(null)}
      />
    </>
  );
};
