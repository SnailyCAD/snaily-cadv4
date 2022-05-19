import type { EmsFdDeputy, Feature, Officer } from "@snailycad/types";
import { isUnitOfficer } from "@snailycad/utils";
import { ModalIds } from "types/ModalIds";

export type Args<T> = Record<Feature | "hasActiveDispatchers" | "isDispatch", boolean> & {
  unit: EmsFdDeputy | Officer | null;
} & T;
export interface ModalButton<T = unknown> {
  (args: Args<T>): {
    nameKey: [string, string];
    modalId: ModalIds;
    /* defaults to true **/
    isEnabled?: boolean;
  };
}

export const switchDivision: ModalButton = ({ unit }) => {
  const isEnabled = unit ? isUnitOfficer(unit) && (unit.callsigns?.length ?? 0) >= 1 : false;

  return {
    modalId: ModalIds.SwitchDivisionCallsign,
    nameKey: ["Leo", "switchDivisionCallsign"],
    isEnabled,
  };
};

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

export const addressSearchBtn: ModalButton = () => ({
  modalId: ModalIds.AddressSearch,
  nameKey: ["Leo", "addressSearch"],
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

export const create911CallBtn: ModalButton = ({ isDispatch, hasActiveDispatchers }) => ({
  modalId: ModalIds.Manage911Call,
  nameKey: ["Calls", "create911Call"],
  isEnabled: isDispatch ? true : !hasActiveDispatchers,
});
