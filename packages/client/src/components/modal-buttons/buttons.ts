import type { Feature } from "@snailycad/types";
import { ModalIds } from "types/ModalIds";

export type Args<T> = Record<Feature | "hasActiveDispatchers", boolean> & T;
export interface ModalButton<T = unknown> {
  (args: Args<T>): {
    nameKey: [string, string];
    modalId: ModalIds;
    /* defaults to true **/
    isEnabled?: boolean;
  };
}

export const nameSearchBtn: ModalButton = () => ({
  modalId: ModalIds.NameSearch,
  nameKey: ["Leo", "nameSearch"],
});

export const plateSearchBtn: ModalButton = () => ({
  modalId: ModalIds.VehicleSearch,
  nameKey: ["Leo", "plateSearch"],
});

export const weaponSearchBtn: ModalButton = ({ WEAPON_REGISTRATION }) => ({
  modalId: ModalIds.WeaponSearch,
  nameKey: ["Leo", "weaponSearch"],
  isEnabled: WEAPON_REGISTRATION,
});

export const customFieldSearchBtn: ModalButton = () => ({
  modalId: ModalIds.CustomFieldSearch,
  nameKey: ["Leo", "customFieldSearch"],
});

export const createWrittenWarningBtn: ModalButton = () => ({
  modalId: ModalIds.CreateWrittenWarning,
  nameKey: ["Leo", "createWrittenWarning"],
});

export const createTicketBtn: ModalButton = () => ({
  modalId: ModalIds.CreateTicket,
  nameKey: ["Leo", "createTicket"],
});

export const createArrestReportBtn: ModalButton = () => ({
  modalId: ModalIds.CreateArrestReport,
  nameKey: ["Leo", "createArrestReport"],
});

export const createBoloBtn: ModalButton = () => ({
  modalId: ModalIds.ManageBolo,
  nameKey: ["Leo", "createBolo"],
});

export const createWarrantBtn: ModalButton = () => ({
  modalId: ModalIds.CreateWarrant,
  nameKey: ["Leo", "createWarrant"],
});

export const notepadBtn: ModalButton = () => ({
  modalId: ModalIds.Notepad,
  nameKey: ["Leo", "notepad"],
});

export const create911CallBtn: ModalButton = ({ hasActiveDispatchers }) => ({
  modalId: ModalIds.Manage911Call,
  nameKey: ["Calls", "create911Call"],
  isEnabled: !hasActiveDispatchers,
});
