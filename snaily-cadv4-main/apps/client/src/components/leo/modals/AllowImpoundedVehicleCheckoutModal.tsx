import type { ImpoundedVehicle, RegisteredVehicle } from "@snailycad/types";
import type { DeleteLeoCheckoutImpoundedVehicleData } from "@snailycad/types/api";
import { Button, Loader } from "@snailycad/ui";
import { Modal } from "components/modal/Modal";
import useFetch from "lib/useFetch";
import { useModal } from "state/modalState";
import { ModalIds } from "types/modal-ids";
import { useTranslations } from "use-intl";

interface Props<T extends ImpoundedVehicle | RegisteredVehicle> {
  vehicle?: T | null;
  onCheckout(vehicle: T): void;
}

export function AllowImpoundedVehicleCheckoutModal<T extends ImpoundedVehicle | RegisteredVehicle>({
  vehicle,
  onCheckout,
}: Props<T>) {
  const modalState = useModal();
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
      modalState.closeModal(ModalIds.AlertCheckoutImpoundedVehicle);
    }
  }

  return (
    <Modal
      title={t("Leo.allowCheckout")}
      onClose={() => modalState.closeModal(ModalIds.AlertCheckoutImpoundedVehicle)}
      isOpen={modalState.isOpen(ModalIds.AlertCheckoutImpoundedVehicle)}
    >
      <p className="my-3">{t("Leo.alert_allowCheckout")}</p>
      <div className="flex items-center justify-end gap-2 mt-2">
        <Button
          variant="cancel"
          disabled={state === "loading"}
          onPress={() => modalState.closeModal(ModalIds.AlertCheckoutImpoundedVehicle)}
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
