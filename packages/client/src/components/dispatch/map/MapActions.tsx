import { createPortal } from "react-dom";
import { usePortal } from "@casper124578/useful";
import { Rank } from "@snailycad/types";
import { Button } from "components/Button";
import { useAuth } from "context/AuthContext";
import { useTranslations } from "next-intl";
import { useModal } from "context/ModalContext";
import { ModalIds } from "types/ModalIds";

export function MapActions() {
  const t = useTranslations();
  const { user } = useAuth();
  const portalRef = usePortal("MapActions");
  const { openModal } = useModal();

  return (
    portalRef &&
    createPortal(
      <div className="fixed z-50 flex gap-2 left-0 bottom-0 p-3 transition-colors bg-black/20 hover:bg-black/30 rounded-tr-md">
        <Button
          onClick={() => {
            // this.setState((prev) => ({ ...prev, blipsShown: !prev.blipsShown }));
            // this.toggleBlips(!this.state.blipsShown);
          }}
        >
          Show
          {/* {this.state.blipsShown ? this.props.t("Leo.hideBlips") : this.props.t("Leo.showBlips")} */}
        </Button>
        <Button onClick={() => openModal(ModalIds.Manage911Call)}>
          {t("Calls.create911Call")}
        </Button>
        {user?.rank !== Rank.USER ? (
          <Button
            onClick={() => {
              this.setState({
                showAllPlayers: !this.state.showAllPlayers,
              });
            }}
            className="btn btn-primary"
          >
            {false ? "Show only LEO/EMS-FD" : "Show all players"}
          </Button>
        ) : null}
      </div>,
      portalRef,
    )
  );
}
