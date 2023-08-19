import { createPortal } from "react-dom";
import { usePortal } from "@casperiv/useful";
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Status,
} from "@snailycad/ui";
import { useTranslations } from "next-intl";
import { useModal } from "state/modalState";
import { ModalIds } from "types/modal-ids";
import { MapItem, useDispatchMapState, useSocketStore } from "state/mapState";
import { Permissions, usePermission } from "hooks/usePermission";

export function MapActions() {
  const t = useTranslations();
  const portalRef = usePortal("MapActions");
  const { openModal } = useModal();
  const mapState = useDispatchMapState((state) => ({
    hiddenItems: state.hiddenItems,
    setItem: state.setItem,
  }));
  const status = useSocketStore((state) => state.status);

  const { hasPermissions } = usePermission();
  const hasManageUsersPermissions = hasPermissions([Permissions.ManageUsers]);
  const hasManageSmartSignsPermissions = hasPermissions([Permissions.ManageSmartSigns]);

  return (
    portalRef &&
    createPortal(
      <div className="group fixed z-50 left-0 bottom-0 p-3 transition-colors bg-black/20 hover:bg-black/50 rounded-tr-md">
        <p className="mb-2 group-hover:text-white">
          <Status>{status}</Status>
        </p>

        <div className="flex gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild key="trigger">
              <Button>{t("Leo.toggle")}</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="min-w-[175px]" align="start" key="content">
              {hasManageSmartSignsPermissions ? (
                <DropdownMenuItem onClick={() => mapState.setItem(MapItem.SMART_SIGNS)}>
                  {mapState.hiddenItems[MapItem.SMART_SIGNS]
                    ? t("Leo.showSmartSigns")
                    : t("Leo.hideSmartSigns")}
                </DropdownMenuItem>
              ) : null}
              <DropdownMenuItem onClick={() => mapState.setItem(MapItem.BLIPS)}>
                {mapState.hiddenItems[MapItem.BLIPS] ? t("Leo.showBlips") : t("Leo.hideBlips")}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => mapState.setItem(MapItem.CALLS)}>
                {mapState.hiddenItems[MapItem.CALLS] ? t("Leo.showCalls") : t("Leo.hideCalls")}
              </DropdownMenuItem>

              {hasManageUsersPermissions ? (
                <DropdownMenuItem onClick={() => mapState.setItem(MapItem.UNITS_ONLY)}>
                  {mapState.hiddenItems[MapItem.UNITS_ONLY]
                    ? t("Leo.showAllPlayers")
                    : t("Leo.showUnitsOnly")}
                </DropdownMenuItem>
              ) : null}
            </DropdownMenuContent>
          </DropdownMenu>

          <Button onPress={() => openModal(ModalIds.Manage911Call)}>
            {t("Calls.create911Call")}
          </Button>
          <Button onPress={() => openModal(ModalIds.SelectMapServer)}>
            {t("Leo.selectMapServer")}
          </Button>
        </div>
      </div>,
      portalRef,
    )
  );
}
