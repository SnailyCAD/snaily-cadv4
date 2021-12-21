/* eslint-disable */
import React, { Component } from "react";

import L from "leaflet";
// const L = dynamic(() => import("leaflet").then((d) => d.default).then((d) => d));
import J from "jquery";
import "leaflet.markercluster";
import { v4 as uuid } from "uuid";
import { Socket } from "socket.io-client";

// import { getActiveUnits, getSteamIds, update911Call } from "actions/dispatch/DispatchActions";

// import { socket as CADSocket } from "hooks/useSocket";
import {
  Player,
  DataActions,
  MarkerPayload,
  CustomMarker,
  LatLng,
  defaultTypes,
  Blip,
  BLIP_SIZES,
  IIcon,
  IPopup,
} from "types/Map";
import { getMapBounds, convertToMap, stringCoordToFloat, createCluster } from "lib/map/utils";
// import { ActiveMapCalls } from "components/dispatch/map.ActiveCalls";
// import { ActiveMapUnits } from "components/dispatch/map.ActiveUnits";
// import { Create911Modal } from "components/modals/Create911Modal";
// import { Nullable, State } from "types/State";
import { cad, Call911, User } from "types/prisma";
import { CallInfoHTML, PlayerInfoHTML, BlipInfoHTML } from "lib/map/html";
import { blipTypes } from "lib/map/blips";
import { ModalIds } from "types/ModalIds";
import { Button } from "components/Button";
/* most code in this file is from TGRHavoc/live_map-interface, special thanks to him for making this! */

/*
 ? Search for:
 * REMOVE_CALL_FROM_MAP
 * CREATE_CALL_MARKER
 * UPDATE_CALL_POSITION
 * REMOVE_911_CALL_FROM_MAP
*/

const TILES_URL = "/tiles/minimap_sea_{y}_{x}.png";
type Nullable<T> = T | null;

interface Props {
  cadInfo: cad;
  calls: Call911[];
  user: User;
  steamIds: Partial<User>[];
  getActiveUnits: () => void;
  getSteamIds: () => void;
  // update911Call: (id: string, data: Partial<Call>, notify?: boolean) => void;
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

class MapClass extends Component<Props, MapState> {
  CADSocket: Nullable<Socket>;
  MAPSocket: Nullable<WebSocket>;

  constructor(props: Props) {
    super(props);

    this.state = {
      MarkerStore: [],
      MarkerTypes: defaultTypes,
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
    // this.handleCADSocket = this.handleCADSocket.bind(this);
    this.onMessage = this.onMessage.bind(this);
  }

  async handleMapSocket() {
    await new Promise((resolve) => {
      setTimeout(resolve, 500);
    });

    this.setState({
      loading: false,
    });

    const live_map_url = this.props.cadInfo?.live_map_url ?? "ws://localhost:30121";
    if (!live_map_url) {
      // notify.error("There was no live_map_url provided from the CAD-Settings.", {
      //   autoClose: false,
      // });
      return;
    }
    if (!live_map_url.startsWith("ws")) {
      // notify.error("The live_map_url did not start with ws. Make sure it is a WebSocket protocol", {
      //   autoClose: false,
      // });

      return;
    }

    const socket = new WebSocket(live_map_url);

    socket.addEventListener("error", (e) => {
      // notify.error("An error occurred when trying to connect to the live_map");
      console.error("LIVE_MAP", `${JSON.stringify(e)}`);
    });

    socket.addEventListener("message", (e) => {
      this.onMessage(e);
    });

    this.MAPSocket = socket;

    this.setState({
      loading: false,
    });
  }

  // handleCADSocket() {
  //   this.CADSocket = CADSocket;
  // }

  initMap() {
    if (this.state.ran) return;
    if (typeof window === "undefined") return;

    this.setState({
      ran: true,
    });

    const TileLayer = L.tileLayer(TILES_URL, {
      minZoom: -2,
      maxZoom: 2,
      tileSize: 1024,
      maxNativeZoom: 0,
      minNativeZoom: 0,
    });

    const map = L.map("map", {
      crs: L.CRS.Simple,
      layers: [TileLayer],
      zoomControl: false,
    }).setView([0, 0], 0);

    const bounds = getMapBounds(map);

    map.setMaxBounds(bounds);
    map.fitBounds(bounds);
    map.addLayer(this.state.PlayerMarkers);

    this.setState({
      map,
    });
  }

  showBlips() {
    for (const id in this.state.blips) {
      const blipArr = this.state.blips[id];

      blipArr?.forEach((blip) => {
        const marker = this.state.MarkerStore?.[blip.markerId];

        marker?.addTo(this.state.map!);
      });
    }
  }

  blipSuccess(data: any) {
    for (const id in data) {
      if (data?.[id]) {
        const blipArray = data[id];

        for (const i in blipArray) {
          const blip = blipArray[i];
          const fallbackName = `${id} | ${this.state?.MarkerTypes?.[+id]?.name}` || id;

          blip.name = blip?.name || fallbackName;
          blip.description = blip?.description || "N/A";

          blip.type = id;
          this.createBlip(blip);
        }
      }
    }
  }

  toggleBlips(show: boolean) {
    this.setState({
      MarkerStore: this.state.MarkerStore.map((marker) => {
        if (marker.payload.isBlip) {
          if (show) {
            marker.addTo(this.state.map!);
          } else {
            marker.remove();
            marker.removeFrom(this.state.map!);
          }
        }

        return marker;
      }),
    });
  }

  createMarker(draggable: boolean, payload: MarkerPayload, title: string) {
    if (this.state.map === null) return;
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
    const infoContent =
      (payload.player && PlayerInfoHTML(payload.player)) ||
      (payload.call && CallInfoHTML(payload.call)) ||
      BlipInfoHTML(payload);
    const where = payload.player ? this.state.PlayerMarkers : this.state.map;

    const marker: CustomMarker = (L as any)
      .marker(converted, {
        title,
        draggable,
      })
      .addTo(where)
      .bindPopup(infoContent);

    if (payload.icon !== null && payload.icon?.iconUrl) {
      const img = L.icon(payload.icon);
      marker.setIcon(img);
    }

    marker.payload = payload;

    this.setState({
      MarkerStore: [...this.state.MarkerStore, marker],
    });

    return marker;
  }

  createBlip(blip: Blip) {
    if (!blip.pos) {
      if (!blip?.pos) {
        blip.pos = {
          x: blip.x,
          y: blip.y,
          z: blip.z,
        };

        delete blip.x;
        delete blip.y;
        delete blip.z;
      }
    }

    const obj: MarkerPayload = {
      title: blip.name,
      pos: blip.pos,
      description: blip.description,
      icon: this.state.MarkerTypes?.[blip.type] ?? null,
      id: uuid(),
      isBlip: true,
    };

    if (!this.state.blips[blip.type]) {
      this.setState((prev) => {
        return {
          ...prev,
          blips: (prev.blips[blip.type] = []),
        };
      });
    }

    const marker = this.createMarker(false, obj, blip.name);
    if (!marker) return;

    const blips = this.state.blips;
    blips[blip.type]?.push(blip);

    this.setState({
      blips,
    });
  }

  async initBlips() {
    const nameToId: any = {};
    let blipCss = "";

    const generateBlips = () => {
      blipCss = `.blip {
        background: url("/map/blips_texturesheet.png");
        background-size: ${1024 / 2}px ${1024 / 2}px;
        display: inline-block;
        width: ${BLIP_SIZES.width}px;
        height: ${BLIP_SIZES.height}px;
      }`;

      const current = {
        x: 0,
        y: 0,
        id: 0,
      };

      for (const blipName in blipTypes) {
        const blip = blipTypes[blipName];

        if (!blip.id) {
          current.id = current.id + 1;
        } else {
          current.id = blip.id;
        }

        if (!blip.x) {
          current.x += 1;
        } else {
          current.x = blip.x;
        }

        if (blip.y) {
          current.y = blip.y;
        }

        const MarkerTypes = this.state.MarkerTypes;
        MarkerTypes[current.id] = {
          name: blipName.replace(/([A-Z0-9])/g, " $1").trim(),
          className: `blip blip-${blipName}`,
          iconUrl:
            "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAFElEQVR4XgXAAQ0AAABAMP1L30IDCPwC/o5WcS4AAAAASUVORK5CYII=",
          iconSize: [BLIP_SIZES.width, BLIP_SIZES.height],
          iconAnchor: [BLIP_SIZES.width / 2, 0],
          popupAnchor: [0, 0],
        };

        this.setState({
          MarkerTypes,
        });

        nameToId[blipName] = current.id;

        const left = current.x * BLIP_SIZES.width + 0;
        const top = current.y * BLIP_SIZES.height + 0;

        blipCss += `.blip-${blipName} { background-position: -${left}px -${top}px }`;
      }

      J("head").append(`<style>${blipCss}</style>`);
      setTimeout(generateBlipControls, 50);

      this.showBlips();
    };

    const generateBlipControls = () => {
      for (const blipName in blipTypes) {
        J("#blip-control-container").append(
          `<a data-blip-number="${nameToId[blipName]}" id="blip_${blipName}_link" class="blip-button-a list-group-item d-inline-block collapsed blip-enabled" href="#"><span class="blip blip-${blipName}"></span></a>`,
        );
      }

      J(".blip-button-a").on("click", (e) => {
        const element = $(e.currentTarget);

        // toggle blip
        element.addClass("blip-enabled");

        this.showBlips();
      });
    };

    const blipSuccess = async (data: any) => {
      for (const id in data) {
        if (data?.[id]) {
          const blipArray = data[id];

          for (const i in blipArray) {
            const blip = blipArray[i];
            const fallbackName = `${id} | ${this.state.MarkerTypes?.[+id]?.name}` || id;

            blip.name = blip?.name || fallbackName;
            blip.description = blip?.description || "N/A";

            blip.type = id;
            createBlip(blip);
          }
        }
      }
    };

    const createBlip = (blip: Blip) => {
      if (!blip.pos) {
        if (!blip?.pos) {
          blip.pos = {
            x: blip.x,
            y: blip.y,
            z: blip.z,
          };

          delete blip.x;
          delete blip.y;
          delete blip.z;
        }
      }

      const obj: MarkerPayload = {
        title: blip.name,
        pos: blip.pos,
        description: blip.description,
        icon: this.state.MarkerTypes?.[blip.type] ?? null,
        id: uuid(),
        isBlip: true,
      };

      if (!this.state.blips?.[blip.type]) {
        this.setState((prev) => {
          prev.blips[blip.type] = [];

          return prev;
        });
      }

      const marker = this.createMarker(false, obj, blip.name);
      if (!marker) return;

      this.setState((prev) => {
        prev.blips[blip.type]?.push(blip);

        return prev;
      });
    };

    generateBlips();

    J.ajax("/blips.json", {
      success: blipSuccess,
      dataType: "json",
    });
  }

  remove911Call(id: string) {
    this.setState((prev) => {
      const marker = prev.MarkerStore.find((m) => m.payload.call?.id === id);
      marker?.remove();
      marker?.removeFrom(this.state.map!);

      return {
        ...prev,
        MarkerStore: prev.MarkerStore.filter((marker) => {
          if (marker.payload.call) {
            return marker.payload.call.id !== id;
          }
          return true;
        }),
      };
    });
  }

  // async handleCalls() {
  //   if (!this.state.map) return;
  //   await new Promise((resolve) => {
  //     setTimeout(resolve, 500);
  //   });

  //   this.props.calls.forEach((call) => {
  //     // ? REMOVE_CALL_FROM_MAP
  //     const m = this.state.MarkerStore.some((marker) => marker.payload?.call?.id === call.id);

  //     if (m) return;
  //     if (call.hidden === "1") return;

  //     // ? CREATE_CALL_MARKER
  //     const marker = this.createMarker(
  //       true,
  //       {
  //         icon: null,
  //         description: `911 Call from: ${call.name}`,
  //         id: uuid(),
  //         pos: (call as any).pos,
  //         isPlayer: false,
  //         title: "911 Call",
  //         call,
  //       },
  //       call.location,
  //     );
  //     if (!marker) return;

  //     // ? UPDATE_CALL_POSITION
  //     marker.on("moveend", async (e) => {
  //       const target = e.target;
  //       const latLng: LatLng = (target as any)._latlng;

  //       // send data to in-game to create blip on map
  //       // tODO: convert latLng back to x, y,z
  //       // socket?.send(
  //       //   jSON.stringify({
  //       //     type: "update911Call",
  //       //     call: call,
  //       //   }),
  //       // );

  //       this.props.update911Call(
  //         call.id,
  //         {
  //           ...call,
  //           pos: latLng,
  //         } as any,
  //         false,
  //       );
  //     });
  //   });
  // }

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

          const marker = this.state?.MarkerStore?.find((marker) => {
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
              this.state.MarkerTypes?.[Number(player.icon)] ?? (this.state.MarkerTypes[6] as IIcon);

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
    this.handleMapSocket();
    // this.handleCADSocket();
    this.initMap();

    // get all values from backend
    // !this.state.ran && this.props?.getActiveUnits();
    // !this.state.ran && this.props?.getSteamIds();

    // this.handleCalls();
    this.initBlips();

    // ? REMOVE_911_CALL_FROM_MAP
    this.CADSocket?.on("END_911_CALL", (callId: string) => {
      this.remove911Call(callId);
    });
  }

  // componentDidUpdate() {
  //   if (this.props?.calls) {
  //     this.handleCalls();
  //   }
  // }

  // componentWillUnmount() {
  //   this.state.map?.remove();
  //   this.MAPSocket?.close();
  //   // this.state.MAPSocket = null;

  //   this.setState({
  //     MarkerStore: [],
  //     blips: [],
  //     blipsShown: true,
  //     MarkerTypes: defaultTypes,
  //     PopupStore: [],
  //     map: null,
  //     ran: false,
  //   });
  // }

  render() {
    if (typeof window === "undefined") return null;

    return (
      <>
        <div id="map" style={{ zIndex: 1, height: "calc(100vh - 4rem)", width: "100%" }} />

        <div className="absolute z-50 flex gap-2 left-4 bottom-4">
          <Button
            onClick={() => {
              this.setState((prev) => ({ ...prev, blipsShown: !prev.blipsShown }));
              this.toggleBlips(!this.state.blipsShown);
            }}
          >
            {this.state.blipsShown ? "Hide Blips" : "Show Blips"}
          </Button>
          <Button>{"Create 911 Call"}</Button>
          {["owner", "admin", "moderator"].includes(`${this.props?.user?.rank}`) ? (
            <button
              onClick={() => {
                if (this.state.showAllPlayers === true) {
                  window.location.reload();
                }

                this.setState({
                  showAllPlayers: !this.state.showAllPlayers,
                });
              }}
              className="btn btn-primary"
            >
              {this.state.showAllPlayers ? "Show only LEO/EMS-FD" : "Show all players"}
            </button>
          ) : null}
        </div>

        {/* <Create911Modal />
        <div className="map-items-container">
          <ActiveMapUnits />
          <ActiveMapCalls
            hasMarker={(callId: string) => {
              return this.state.MarkerStore.some((m) => m.payload?.call?.id === callId);
            }}
            setMarker={(call: Call, type: "remove" | "place") => {
              const marker = this.state.MarkerStore.some((m) => m.payload.call?.id === call.id);
              if (marker && type === "place") return;

              if (marker && type === "remove") {
                this.remove911Call(call.id);
              }

              this.props.update911Call(
                call.id,
                {
                  ...call,
                  hidden: type === "remove" ? "1" : "0",
                },
                false,
              );
            }}
          />
        </div> */}
      </>
    );
  }
}

export const Map = MapClass;
