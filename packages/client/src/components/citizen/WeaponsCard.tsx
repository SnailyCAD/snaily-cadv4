import * as React from "react";
import { Button } from "components/Button";
import { Weapon } from "types/prisma";
import { ModalIds } from "types/ModalIds";
import { useModal } from "context/ModalContext";
import { RegisterWeaponModal } from "./RegisterWeaponModal";

export const WeaponsCard = (props: { weapons: Weapon[] }) => {
  const { openModal, closeModal } = useModal();

  const [weapons, setWeapons] = React.useState<Weapon[]>(props.weapons);
  const [tempWeapon, setTempWeapon] = React.useState<Weapon | null>(null);

  return (
    <>
      <div className="bg-gray-200/60 p-4 rounded-md">
        <header className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Your weapons</h1>

          <Button onClick={() => openModal(ModalIds.RegisterWeapon)} small>
            Add weapon
          </Button>
        </header>

        {weapons.length <= 0 ? (
          <p className="text-gray-600">You do not have any weapons registered yet.</p>
        ) : (
          <table className="table max-h-64 mt-3">
            <thead>
              <tr>
                <th>Model</th>
                <th>Registration Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {weapons.map((weapon) => (
                <tr key={weapon.id}>
                  <td>{weapon.model}</td>
                  <td>{weapon.registrationStatus}</td>
                  <td>
                    <Button small variant="danger">
                      Delete
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
        weapon={null}
        citizens={[]}
      />
    </>
  );
};
