import type { Call911 } from "@snailycad/types";
import type { MarkerPayload, Player } from "types/Map";

export function PlayerInfoHTML(player: Player) {
  return `
      <div class="info-window w-[500px]">
        <div class="info-header-box">
          <div class="info-header">
            <p style="margin:5px;"><strong>Player:</strong> ${player.name}</p>
          </div>
        </div>

        <div class="info-body mt-2">
          <p style="margin:5px"><strong>EMS-FD: </strong> ${player.ems_fd}</p>
          <p style="margin:5px"><strong>Leo: </strong> ${player.leo}</p>
          ${
            player.Weapon
              ? `<p style="margin:5px"><strong>Weapon: </strong> ${player.Weapon}</p>`
              : ""
          }
          <p style="margin:5px"><strong>Location: </strong> ${player?.Location}</p>
          <p style="margin:5px"><strong>Vehicle: </strong> ${player?.Vehicle || "On foot"}</p>
          ${
            player["License Plate"]
              ? `<p  style="margin:5px"><strong>License plate: </strong> ${player["License Plate"]}</p>`
              : ""
          }
          <p style="margin:5px"><strong>Identifier: </strong> ${player?.identifier}</p>
        </div>
      </div>
  `;
}

export function CallInfoHTML(call: Call911) {
  return `
      <div style="min-width: 250px;">
        <div class="d-flex flex-column">
          <p style="margin: 2px; font-size: 1rem;">
            <strong>Location: </strong> ${call.location}
          </p>
          <p style="margin: 2px; font-size: 1rem;">
            <strong>Caller: </strong> ${call.name}
          </p>
          <p style="margin: 2px; font-size: 1rem;">
            <strong>Description: </strong> ${call.description}
          </p>
        </div>
      </div>
    `;
}

export function BlipInfoHTML(blip: MarkerPayload) {
  return `
      <div style="min-width: 50px;">
        <div class="flex flex-col">
          <p style="margin: 0;" class="text-base">
            <strong>Name: </strong> ${blip.title}
          </p>
        </div>
      </div>
    `;
}
