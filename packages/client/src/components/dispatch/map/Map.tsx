import * as React from "react";

import L from "leaflet";
import "leaflet.markercluster";
import { v4 as uuid } from "uuid";
import type { Socket } from "socket.io-client";

import type {
  Player,
  DataActions,
  MarkerPayload,
  CustomMarker,
  LatLng,
  Blip,
  IIcon,
  IPopup,
} from "types/Map";
import { convertToMap, stringCoordToFloat, createCluster } from "lib/map/utils";

import type { cad, Call911, User } from "@snailycad/types";
import { PlayerInfoHTML } from "lib/map/html";

import type { Full911Call } from "state/dispatchState";
import { toastError } from "lib/error";

/* most code in this file is from TGRHavoc/live_map-interface, special thanks to him for making this! */

interface Props {
  openModal(id: string): void;
  user: User;
  update911Call(call: Omit<Full911Call, "events" | "assignedUnits">): Promise<void>;
  calls: Call911[];
  cad: cad;
  t(key: string): string;
}

interface MapState {
  MarkerStore: CustomMarker[];
  MarkerTypes: Record<number, IIcon>;
  PopupStore: IPopup[];
  blips: Blip[][];
  PlayerMarkers: L.Layer;
  map: L.Map | null;
  ran: boolean;
  blipsShown: boolean;
  showAllPlayers: boolean;
  loading: boolean;
}

class MapClass extends React.Component<Props, MapState> {
  CADSocket: Socket | null;
  MAPSocket: WebSocket | null;

  constructor(props: Props) {
    super(props);

    this.state = {
      MarkerStore: [],
      PopupStore: [],
      blips: [[]],
      PlayerMarkers: createCluster(),
      map: null,
      ran: false,
      blipsShown: true,
      showAllPlayers: false,
      loading: true,
    };

    this.CADSocket = null;
    this.MAPSocket = null;

    this.handleMapSocket = this.handleMapSocket.bind(this);
    this.onMessage = this.onMessage.bind(this);
  }

  createMarker(draggable: boolean, payload: MarkerPayload, title: string) {
    if (!this.state.map) return;

    let newPos: LatLng;
    if (!payload.pos) return;

    if ("lat" in payload.pos) {
      newPos = {
        lat: payload.pos.lat,
        lng: payload.pos.lng,
      };
    } else {
      const coords = stringCoordToFloat(payload.pos);
      const converted = convertToMap(coords.x, coords.y, this.state.map);
      if (!converted) return;

      newPos = converted;
    }

    const converted = newPos;
    const infoContent = payload.player && PlayerInfoHTML(payload.player);
    const where = payload.player ? this.state.PlayerMarkers : this.state.map;

    const marker: CustomMarker = (L as any)
      .marker(converted, {
        title,
        draggable,
      })
      .addTo(where)
      .bindPopup(infoContent);

    if (payload.icon?.iconUrl) {
      const img = L.icon(payload.icon);
      marker.setIcon(img);
    }

    marker.payload = payload;

    this.setState({
      MarkerStore: [...this.state.MarkerStore, marker],
    });

    return marker;
  }

  async onMessage(e: any) {
    const data = JSON.parse(e.data) as DataActions;

    switch (data.type) {
      case "playerLeft": {
        const marker = this.state.MarkerStore.find((marker) => {
          return marker.payload.player?.identifier === data.payload;
        });

        this.setState((prev) => {
          return {
            ...prev,
            MarkerStore: prev.MarkerStore.filter((marker) => {
              return marker.payload.player?.identifier !== data.payload;
            }),
          };
        });

        marker?.removeFrom(this.state.map!);
        break;
      }
      case "playerData": {
        data.payload.forEach((player: Player) => {
          if (!player.identifier) return;
          if (!player.name) return;

          const marker = this.state.MarkerStore.find((marker) => {
            return marker.payload?.player?.identifier === player.identifier;
          });

          // type Member = Partial<User> | null | undefined;
          // const member: Member = this.props?.steamIds?.find(
          //   (m) => `steam:${m.steamId}` === player?.identifier,
          // );

          // // if (!this.state.showAllPlayers && !member) return;
          // // if (!this.state.showAllPlayers && (member?.leo === "0" || member?.ems_fd === "0")) {
          // //   return;
          // // }

          // player.ems_fd = member?.isEmsFd;
          // player.leo = member?.isLeo;

          const html = PlayerInfoHTML(player);

          if (marker) {
            const coords = stringCoordToFloat(player.pos);
            const converted = convertToMap(coords.x, coords.y, this.state.map!);
            if (!converted) return;

            marker.setLatLng(converted);

            const popup = this.state.PopupStore.find((popup) => {
              // @ts-expect-error this works!
              return popup.options.identifier === player.identifier;
            });

            popup?.setContent(html);

            const iconType = this.state.MarkerTypes[Number(player.icon)];
            if (iconType) {
              marker.setIcon(L.icon(iconType));
            }

            if (popup?.isOpen()) {
              if (popup.getLatLng()?.distanceTo(marker.getLatLng()) !== 0) {
                popup.setLatLng(marker.getLatLng());
              }
            }
          } else {
            const icon =
              this.state.MarkerTypes[Number(player.icon)] ?? (this.state.MarkerTypes[6] as IIcon);

            const marker = this.createMarker(
              false,
              {
                icon,
                description: "Hello world",
                pos: player.pos,
                title: player.name,
                isPlayer: true,
                player,
                id: uuid(),
              },
              player?.name,
            );

            if (!marker) {
              return console.error("CANNOT_FIND_MARKER");
            }

            marker?.unbindPopup();

            const popup = L.popup({
              // @ts-expect-error this works!
              identifier: player.identifier,

              minWidth: 500,
            })
              .setContent(html)
              .setLatLng(marker.getLatLng());

            this.setState((prev) => {
              return {
                ...prev,
                PopupStore: [...prev.PopupStore, popup as IPopup],
              };
            });

            marker.on("click", (e) => {
              this.state.map?.closePopup((this.state.map as any)._popup);
              popup.setLatLng((e as any).latlng);
              this.state.map?.openPopup(popup);
            });
          }
        });
        break;
      }
      default: {
        break;
      }
    }
  }

  componentDidMount() {
    // this.handleMapSocket();
    // this.initMap();
  }

  // componentDidUpdate(prevProps: Props, prevState: MapState) {
  //   let hasChanged = false;
  //   const prevMap = prevState.map;
  //   const newMap = this.state.map;

  //   if (prevMap === null && newMap) {
  //     this.handleCalls();
  //     this.initBlips();
  //   }

  //   for (let i = 0; i < prevProps.calls.length; i++) {
  //     const a = prevProps.calls[i];
  //     const b = this.props.calls[i];

  //     if (a?.updatedAt !== b?.updatedAt) {
  //       hasChanged = true;
  //     }
  //   }

  //   if (hasChanged && this.props.calls.length && this.state.map) {
  //     this.handleCalls();
  //   }
  // }

  componentWillUnmount() {
    this.state.map?.remove();
    this.MAPSocket?.close();

    this.setState({
      MarkerStore: [],
      blips: [],
      blipsShown: true,
      PopupStore: [],
      map: null,
      ran: false,
    });
  }

  render() {
    return null;
  }
}

export const Map = MapClass;
