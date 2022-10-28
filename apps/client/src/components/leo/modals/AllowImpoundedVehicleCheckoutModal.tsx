import type { ImpoundedVehicle, RegisteredVehicle } from "@snailycad/types";
import type { DeleteLeoCheckoutImpoundedVehicleData } from "@snailycad/types/api";
import { Button, Loader } from "@snailycad/ui";
import { Modal } from "components/modal/Modal";
import useFetch from "lib/useFetch";
import { useModal } from "state/modalState";
import { ModalIds } from "types/ModalIds";
import { useTranslations } from "use-intl";

interface Props<T extends ImpoundedVehicle | RegisteredVehicle> {
  vehicle?: T | null;
  onCheckout(vehicle: T): void;
}

export function AllowImpoundedVehicleCheckoutModal<T extends ImpoundedVehicle | RegisteredVehicle>({
  vehicle,
  onCheckout,
}: Props<T>) {
  const { isOpen, closeModal } = useModal();
  const { state, execute } = useFetch();
  const t = useTranslations();

  async function handleCheckout() {
    if (!vehicle) return;

    const { json } = await execute<DeleteLeoCheckoutImpoundedVehicleData>({
      path: `/leo/impounded-vehicles/${vehicle.id}`,
      method: "DELETE",
    });

    if (typeof json === "boolean") {
      onCheckout(vehicle);
      closeModal(ModalIds.AlertCheckoutImpoundedVehicle);
    }
  }

  return (
    <Modal
      title={t("Leo.allowCheckout")}
      onClose={() => closeModal(ModalIds.AlertCheckoutImpoundedVehicle)}
      isOpen={isOpen(ModalIds.AlertCheckoutImpoundedVehicle)}
    >
      <p className="my-3">{t("Leo.alert_allowCheckout")}</p>
      <div className="flex items-center justify-end gap-2 mt-2">
        <Button
          variant="cancel"
          disabled={state === "loading"}
          onPress={() => closeModal(ModalIds.AlertCheckoutImpoundedVehicle)}
        >
          {t("Common.no")}
        </Button>
        <Button
          disabled={state === "loading"}
          className="flex items-center"
          onPress={handleCheckout}
        >
          {state === "loading" ? <Loader className="mr-2 border-red-200" /> : null}{" "}
          {t("Common.yes")}
        </Button>
      </div>
    </Modal>
  );
}
