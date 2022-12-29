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
import { makeUnitName } from "lib/utils";
import { useGenerateCallsign } from "hooks/useGenerateCallsign";

interface Props {
  player: MapPlayer | PlayerDataEventPayload;
  handleToggle(name: string): void;
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
  const { generateCallsign } = useGenerateCallsign();

  const playerIcon = React.useMemo(() => {
    if (parseInt(player.icon, 10) === 56 && player.hasSirenEnabled) {
      const blipSize = 35;

      return leafletIcon({
        iconUrl: "/map/siren.gif",
        iconSize: [blipSize, blipSize],
        iconAnchor: [blipSize / 2, 0],
        popupAnchor: [0, 0],
      });
    }

    const playerIcon = markerTypes[parseInt(player.icon, 10)];

    if (playerIcon) {
      return leafletIcon(playerIcon);
    }

    return PLAYER_ICON;
  }, [player.icon, player.hasSirenEnabled, markerTypes]);

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
  const playerSteamId = player.convertedSteamId;
  const playerDiscordId = player.discordId;
  const isSteamUser = playerSteamId && user?.steamId === playerSteamId;
  const isDiscordUser = playerDiscordId && user?.discordId === playerDiscordId;
  const isUser = isSteamUser || isDiscordUser;

  if (showUnitsOnly) {
    if (!hasUnit || !isUser) {
      return null;
    }
  }

  const unitName = hasUnit && player.unit ? makeUnitName(player.unit) : player.name;
  const unitCallsign = hasUnit && player.unit ? generateCallsign(player.unit) : null;
  const unitNameAndCallsign = unitName && unitCallsign ? `${unitCallsign} ${unitName}` : unitName;

  return (
    <Marker ref={(ref) => (player.ref = ref)} icon={playerIcon} key={player.name} position={pos}>
      <Tooltip direction="top">{unitNameAndCallsign}</Tooltip>

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

        {player.weapon ? (
          <p style={{ margin: 2 }}>
            <strong>{t("weapon")}: </strong> {player.weapon}
          </p>
        ) : null}
        <p style={{ margin: 2 }}>
          <strong>{t("location")}: </strong> {player.location}
        </p>
        <p style={{ margin: 2 }}>
          <strong>{t("vehicle")}: </strong> {player.vehicle || t("onFoot")}
        </p>
        {player.licensePlate ? (
          <p style={{ margin: 2 }}>
            <strong>{t("licensePlate")}: </strong> {player.licensePlate}
          </p>
        ) : null}
        {player.convertedSteamId ? (
          <p style={{ margin: 2 }}>
            <strong>{t("steamId")}: </strong> {player.convertedSteamId}
          </p>
        ) : null}
        {player.discordId ? (
          <p style={{ margin: 2 }}>
            <strong>{t("discordId")}: </strong> {player.discordId}
          </p>
        ) : null}

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
