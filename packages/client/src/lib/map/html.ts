import { Call911 } from "types/prisma";
import { MarkerPayload, Player } from "types/Map";

export function PlayerInfoHTML(player: Player) {
  return `
      <div class="info-window">
        <div class="info-header-box">
          <div class="info-header"><strong>Player:</strong> ${player.name}</div>
        </div>
        <div class="clear"></div>
        <div class="info-body mt-2">
          <p style="margin:5px"><strong>EMS-FD: </strong> ${player.ems_fd}</p>
          <p style="margin:5px"><strong>Leo: </strong> ${player.leo}</p>
          <p style="margin:5px"><strong>Weapon: </strong> ${player.Weapon}</p>
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
          <button
            class="btn btn-success mt-2"
            data-bs-toggle="collapse"
            data-bs-target="#collapse-${call.id}"
          >
            Toggle
          </button>
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
