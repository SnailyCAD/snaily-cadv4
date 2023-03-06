import { hasPermission, Permissions } from "@snailycad/permissions";
import type { EmsFdDeputy, Feature, User } from "@snailycad/types";
import { isUnitOfficer } from "@snailycad/utils";
import type { ActiveOfficer } from "state/leo-state";
import { ModalIds } from "types/ModalIds";

export type Args<T> = Record<Feature | "hasActiveDispatchers" | "isDispatch", boolean> & {
  unit: EmsFdDeputy | ActiveOfficer | null;
  user: User;
} & T;
export interface ModalButton<T = unknown> {
  (args: Args<T>): {
    nameKey: [string, string];
    modalId: ModalIds;
    /* defaults to true **/
    isEnabled?: boolean;
  };
}

export const switchDivision: ModalButton = ({ DIVISIONS, unit }) => {
  const isEnabled = unit ? isUnitOfficer(unit) && (unit.callsigns?.length ?? 0) >= 1 : false;

  return {
    modalId: ModalIds.SwitchDivisionCallsign,
    nameKey: ["Leo", "switchDivisionCallsign"],
    isEnabled: DIVISIONS && isEnabled,
  };
};

export const selectDepartmentBtn: ModalButton = () => ({
  modalId: ModalIds.SelectDepartment,
  nameKey: ["Leo", "selectDepartment"],
});

export const nameSearchBtn: ModalButton = () => ({
  modalId: ModalIds.NameSearch,
  nameKey: ["Leo", "nameSearch"],
});

export const plateSearchBtn: ModalButton = () => ({
  modalId: ModalIds.VehicleSearch,
  nameKey: ["Leo", "plateSearch"],
});

export const businessSearchBtn: ModalButton = ({ BUSINESS }) => ({
  modalId: ModalIds.BusinessSearch,
  nameKey: ["Leo", "businessSearch"],
  isEnabled: BUSINESS,
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

export const createTicketBtn: ModalButton = ({ LEO_TICKETS }) => ({
  isEnabled: LEO_TICKETS,
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

export const createWarrantBtn: ModalButton = ({ user }) => ({
  modalId: ModalIds.CreateWarrant,
  nameKey: ["Leo", "createWarrant"],
  isEnabled: hasPermission({ userToCheck: user, permissionsToCheck: [Permissions.ManageWarrants] }),
});

export const notepadBtn: ModalButton = () => ({
  modalId: ModalIds.Notepad,
  nameKey: ["Leo", "notepad"],
});

export const create911CallBtn: ModalButton = ({ CALLS_911 }) => ({
  modalId: ModalIds.Manage911Call,
  nameKey: ["Calls", "create911Call"],
  isEnabled: CALLS_911,
});
