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
  const modalState = useModal();
  const mapState = useDispatchMapState((state) => ({
    hiddenItems: state.hiddenItems,
    setItem: state.setItem,
  }));
  const status = useSocketStore((state) => state.status);

  const { hasPermissions } = usePermission();
  const hasManageUsersPermissions = hasPermissions([Permissions.ManageUsers]);
  const hasManageSmartSignsPermissions = hasPermissions([Permissions.ManageSmartSigns]);
  const hasManageSmartMotorwaySignsPermissions = hasPermissions([
    Permissions.ManageSmartMotorwaySigns,
  ]);

  return (
    <div className="group text-white transition-colors mb-6">
      <p className="mb-2">
        <Status>{status}</Status>
      </p>

      <div className="grid grid-cols-2 gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild key="trigger">
            <Button size="xs">{t("Leo.toggle")}</Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="min-w-[175px]" align="start" key="content">
            {hasManageSmartSignsPermissions ? (
              <DropdownMenuItem onClick={() => mapState.setItem(MapItem.SMART_SIGNS)}>
                {mapState.hiddenItems[MapItem.SMART_SIGNS]
                  ? t("Leo.showSmartSigns")
                  : t("Leo.hideSmartSigns")}
              </DropdownMenuItem>
            ) : null}
            {hasManageSmartMotorwaySignsPermissions ? (
              <DropdownMenuItem onClick={() => mapState.setItem(MapItem.SMART_MOTORWAY_SIGNS)}>
                {mapState.hiddenItems[MapItem.SMART_MOTORWAY_SIGNS]
                  ? t("Leo.showSmartMotorwaySigns")
                  : t("Leo.hideSmartMotorwaySigns")}
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

        <Button size="xs" onPress={() => modalState.openModal(ModalIds.Manage911Call)}>
          {t("Calls.create911Call")}
        </Button>
        <Button size="xs" onPress={() => modalState.openModal(ModalIds.SelectMapServer)}>
          {t("Leo.selectMapServer")}
        </Button>
      </div>
    </div>
  );
}
