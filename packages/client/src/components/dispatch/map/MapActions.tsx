import { createPortal } from "react-dom";
import { usePortal } from "@casper124578/useful";
import { Button } from "components/Button";
import { useTranslations } from "next-intl";
import { useModal } from "state/modalState";
import { ModalIds } from "types/ModalIds";
import { MapItem, useDispatchMapState } from "state/mapState";

export function MapActions() {
  const t = useTranslations();
  const portalRef = usePortal("MapActions");
  const { openModal } = useModal();
  const mapState = useDispatchMapState();

  return (
    portalRef &&
    createPortal(
      <div className="fixed z-50 flex gap-2 left-0 bottom-0 p-3 transition-colors bg-black/20 hover:bg-black/30 rounded-tr-md">
        <Button onClick={() => mapState.setItem(MapItem.BLIPS)}>
          {mapState.hiddenItems[MapItem.BLIPS] ? t("Leo.showBlips") : t("Leo.hideBlips")}
        </Button>
        <Button onClick={() => mapState.setItem(MapItem.CALLS)}>
          {mapState.hiddenItems[MapItem.CALLS] ? t("Leo.showCalls") : t("Leo.hideCalls")}
        </Button>
        <Button onClick={() => mapState.setItem(MapItem.UNITS_ONLY)}>
          {mapState.hiddenItems[MapItem.UNITS_ONLY]
            ? t("Leo.showAllPlayers")
            : t("Leo.showUnitsOnly")}
        </Button>
        <Button onClick={() => openModal(ModalIds.Manage911Call)}>
          {t("Calls.create911Call")}
        </Button>
      </div>,
      portalRef,
    )
  );
}
