import { convertToMap } from "lib/map/utils";
import * as React from "react";
import { Marker, Popup, Tooltip, useMap } from "react-leaflet";
import { defaultPermissions, hasPermission } from "@snailycad/permissions";
import { Button } from "@snailycad/ui";
import type { MapPlayer, PlayerDataEventPayload } from "types/Map";
import { icon as leafletIcon } from "leaflet";
import { useTranslations } from "next-intl";
import { MapItem, useDispatchMapState } from "state/mapState";
import { generateMarkerTypes } from "../RenderMapBlips";
import { makeUnitName } from "lib/utils";
import { useGenerateCallsign } from "hooks/useGenerateCallsign";
import { Rank } from "@snailycad/types";

interface Props {
  player: MapPlayer | PlayerDataEventPayload;
  handleToggle(name: string): void;
}

const PLAYER_ICON = leafletIcon({
  iconUrl: "/map/ped.png",
  iconSize: [40, 40],
  popupAnchor: [0, -20],
  iconAnchor: [20, 20],
  tooltipAnchor: [0, -20],
});

export function PlayerMarker({ player, handleToggle }: Props) {
  const map = useMap();
  const t = useTranslations("Leo");
  const { hiddenItems } = useDispatchMapState();
  const markerTypes = React.useMemo(generateMarkerTypes, []);
  const { generateCallsign } = useGenerateCallsign();

  const playerIcon = React.useMemo(() => {
    if (parseInt(player.icon, 10) === 56 && player.hasSirenEnabled) {
      const blipSize = 35;

      return leafletIcon({
        iconUrl: "/map/siren.gif",
        iconSize: [blipSize, blipSize],
        iconAnchor: [blipSize / 2, blipSize / 2],
        popupAnchor: [0, 0],
      });
    }

    const playerIcon = markerTypes[parseInt(player.icon, 10)];
    if (playerIcon) {
      return leafletIcon(playerIcon);
    }

    // player is on-foot and is a unit
    if ("unit" in player && player.unit) {
      return leafletIcon({
        iconUrl: "/map/unit_ped.png",
        iconSize: [20, 43],
        iconAnchor: [20 / 2, 43 / 2],
        popupAnchor: [0, 0],
      });
    }

    return PLAYER_ICON;
  }, [player, markerTypes]);

  const pos = React.useMemo(
    () => player.pos?.x && player.pos.y && convertToMap(player.pos.x, player.pos.y, map),
    [player.pos, map],
  );
  if (!pos) return null;

  const isCADUser = "steamId" in player;

  const hasAdminPermissions =
    isCADUser &&
    hasPermission({
      userToCheck: player,
      permissionsToCheck: defaultPermissions.allDefaultAdminPermissions,
      fallback: player.rank !== Rank.USER,
    });

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

  if (showUnitsOnly) {
    if (!hasUnit) {
      return null;
    }
  }

  const unitName = hasUnit && player.unit ? makeUnitName(player.unit) : player.name;
  const unitCallsign = hasUnit && player.unit ? generateCallsign(player.unit) : null;
  const unitNameAndCallsign = unitName && unitCallsign ? `${unitCallsign} ${unitName}` : unitName;
  const unitStatus = hasUnit && player.unit ? player.unit.status : null;

  return (
    <Marker
      ref={(ref) => (player.ref = ref)}
      icon={playerIcon}
      key={player.identifier}
      position={pos}
    >
      {unitNameAndCallsign.trim() ? <Tooltip direction="top">{unitNameAndCallsign}</Tooltip> : null}

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
            <p style={{ margin: 2 }}>
              <strong>{t("status")}: </strong> {unitStatus?.value.value}
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
        {player.convertedSteamId && hasAdminPermissions ? (
          <p style={{ margin: 2 }}>
            <strong>{t("steamId")}: </strong> {player.convertedSteamId}
          </p>
        ) : null}
        {player.discordId && hasAdminPermissions ? (
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
