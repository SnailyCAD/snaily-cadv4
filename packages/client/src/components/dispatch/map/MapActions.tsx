import { createPortal } from "react-dom";
import { usePortal } from "@casper124578/useful";
import { Rank } from "@snailycad/types";
import { Button } from "components/Button";
import { useAuth } from "context/AuthContext";
import { useTranslations } from "next-intl";
import { useModal } from "context/ModalContext";
import { ModalIds } from "types/ModalIds";
import { useDispatchMapState } from "state/mapState";

export function MapActions() {
  const t = useTranslations();
  const { user } = useAuth();
  const portalRef = usePortal("MapActions");
  const { openModal } = useModal();
  const mapState = useDispatchMapState();

  return (
    portalRef &&
    createPortal(
      <div className="fixed z-50 flex gap-2 left-0 bottom-0 p-3 transition-colors bg-black/20 hover:bg-black/30 rounded-tr-md">
        <Button onClick={() => mapState.setBlipsHidden(!mapState.blipsHidden)}>
          {mapState.blipsHidden ? t("Leo.showBlips") : t("Leo.hideBlips")}
        </Button>
        <Button onClick={() => openModal(ModalIds.Manage911Call)}>
          {t("Calls.create911Call")}
        </Button>
        {user?.rank !== Rank.USER ? (
          <Button disabled className="btn btn-primary">
            {/* {false ? "Show only LEO/EMS-FD" : "Show all players"} */}
            TODO
          </Button>
        ) : null}
      </div>,
      portalRef,
    )
  );
}
