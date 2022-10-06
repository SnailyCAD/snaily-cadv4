import { convertToMap } from "lib/map/utils";
import * as React from "react";
import { Marker, Popup, Tooltip, useMap } from "react-leaflet";
import { defaultPermissions, hasPermission } from "@snailycad/permissions";
import { Button } from "@snailycad/ui";
import type { MapPlayer, PlayerDataEventPayload } from "types/Map";
import { icon as leafletIcon } from "leaflet";
import { useTranslations } from "next-intl";
import { MapItem, useDispatchMapState } from "state/mapState";
import { useAuth } from "context/AuthContext";
import { generateMarkerTypes } from "../RenderMapBlips";

interface Props {
  player: MapPlayer | PlayerDataEventPayload;
  handleToggle(playerId: string): void;
}

const PLAYER_ICON = leafletIcon({
  iconUrl: "https://unpkg.com/leaflet@1.7.0/dist/images/marker-icon-2x.png",
  iconSize: [25, 40],
  popupAnchor: [0, 0],
  iconAnchor: [9, 8],
});

export function PlayerMarker({ player, handleToggle }: Props) {
  const map = useMap();
  const t = useTranslations("Leo");
  const { user } = useAuth();
  const { hiddenItems } = useDispatchMapState();
  const markerTypes = React.useMemo(generateMarkerTypes, []);

  const playerIcon = React.useMemo(() => {
    const playerIcon = markerTypes[parseInt(player.icon, 10)];

    if (playerIcon) {
      return leafletIcon(playerIcon);
    }

    return PLAYER_ICON;
  }, [player.icon, markerTypes]);

  const pos = React.useMemo(
    () => player.pos?.x && player.pos.y && convertToMap(player.pos.x, player.pos.y, map),
    [player.pos, map],
  );
  if (!pos) return null;

  const isCADUser = "steamId" in player;

  const hasLeoPermissions =
    isCADUser &&
    hasPermission({
      userToCheck: player,
      permissionsToCheck: defaultPermissions.defaultLeoPermissions,
      fallback: player.isLeo,
    });

  const hasEmsFdPermissions =
    isCADUser &&
    hasPermission({
      userToCheck: player,
      permissionsToCheck: defaultPermissions.defaultEmsFdPermissions,
      fallback: player.isEmsFd,
    });

  // eslint-disable-next-line eqeqeq
  const hasUnit = isCADUser && player.unit != null;

  const showUnitsOnly = hiddenItems[MapItem.UNITS_ONLY];
  const playerSteamId = "convertedSteamId" in player ? player.convertedSteamId : null;

  if (showUnitsOnly) {
    if (!hasUnit || playerSteamId !== user?.steamId) {
      return null;
    }
  }

  return (
    <Marker
      ref={(ref) => (player.ref = ref)}
      icon={playerIcon}
      key={player.identifier}
      position={pos}
    >
      <Tooltip direction="top">{player.name}</Tooltip>

      <Popup minWidth={500}>
        <p style={{ margin: 2 }}>
          <strong>{t("player")}:</strong> {player.name}
        </p>
        {isCADUser ? (
          <>
            <p style={{ margin: 2 }}>
              <strong>{t("cadUsername")}: </strong> {player.username}
            </p>

            <p style={{ margin: 2 }}>
              <strong>{t("emsFd")}: </strong> {String(hasEmsFdPermissions)}
            </p>
            <p style={{ margin: 2 }}>
              <strong>{t("leo")}: </strong> {String(hasLeoPermissions)}
            </p>
          </>
        ) : null}

        {player.Weapon ? (
          <p style={{ margin: 2 }}>
            <strong>{t("weapon")}: </strong> {player.Weapon}
          </p>
        ) : null}
        <p style={{ margin: 2 }}>
          <strong>{t("location")}: </strong> {player.Location}
        </p>
        <p style={{ margin: 2 }}>
          <strong>{t("vehicle")}: </strong> {player.Vehicle || t("onFoot")}
        </p>
        {player["License Plate"] ? (
          <p style={{ margin: 2 }}>
            <strong>{t("licensePlate")}: </strong> {player["License Plate"]}
          </p>
        ) : null}
        <p style={{ margin: 2 }}>
          <strong>{t("identifier")}: </strong> {player.identifier}
        </p>

        {"id" in player && player.unit?.id ? (
          <div className="mt-3">
            <Button size="xs" className="!text-base" onPress={() => handleToggle(player.id)}>
              {t("togglePlayer")}
            </Button>
          </div>
        ) : null}
      </Popup>
    </Marker>
  );
}
