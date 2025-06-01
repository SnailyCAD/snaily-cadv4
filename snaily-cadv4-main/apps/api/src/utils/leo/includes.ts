import { Prisma } from "@prisma/client";
import { type LimitedUserPicks } from "@snailycad/types";

export const limitedUserSelect: Record<LimitedUserPicks, boolean> = {
  id: true,
  username: true,
  discordId: true,
  steamId: true,
};

export const unitProperties = Prisma.validator<Prisma.EmsFdDeputySelect>()({
  department: { include: { value: true, links: true } },
  division: { include: { value: true, department: true } },
  status: { include: { value: true } },
  citizen: { select: { name: true, surname: true, id: true } },
  user: { select: limitedUserSelect },
  IncidentInvolvedUnit: { where: { incident: { isActive: true } }, select: { id: true } },
  whitelistStatus: { include: { department: { include: { value: true } } } },
  rank: true,
  activeVehicle: { include: { value: true } },
});

export const _leoProperties = Prisma.validator<Prisma.OfficerSelect>()({
  department: { include: { value: true, links: true } },
  divisions: { include: { value: true, department: true } },
  status: { include: { value: true } },
  citizen: { select: { name: true, surname: true, id: true } },
  whitelistStatus: { include: { department: { include: { value: true } } } },
  user: { select: limitedUserSelect },
  IncidentInvolvedUnit: { where: { incident: { isActive: true } }, select: { id: true } },
  rank: true,
  callsigns: true,
  activeDivisionCallsign: true,
  activeVehicle: { include: { value: true } },
});

export const leoProperties = Prisma.validator<Prisma.OfficerSelect>()({
  ..._leoProperties,
  activeIncident: { include: { events: true } },
});

export const combinedEmsFdUnitProperties = Prisma.validator<Prisma.CombinedEmsFdUnitSelect>()({
  status: { include: { value: true } },
  department: { include: { value: true } },
  deputies: { include: unitProperties },
});

export const combinedUnitProperties = Prisma.validator<Prisma.CombinedLeoUnitSelect>()({
  status: { include: { value: true } },
  department: { include: { value: true } },
  officers: { include: _leoProperties },
  activeVehicle: { include: { value: true } },
});

export const assignedUnitsInclude = Prisma.validator<{ include: Prisma.AssignedUnitSelect }>()({
  include: {
    officer: { include: _leoProperties },
    deputy: { include: unitProperties },
    combinedUnit: {
      include: {
        status: { include: { value: true } },
        department: { include: { value: true } },
        officers: {
          include: _leoProperties,
        },
      },
    },
    combinedEmsFdUnit: {
      include: {
        status: { include: { value: true } },
        department: { include: { value: true } },
        deputies: {
          include: unitProperties,
        },
      },
    },
  },
});

export const callInclude = Prisma.validator<Prisma.Call911Select>()({
  position: true,
  assignedUnits: assignedUnitsInclude,
  events: true,
  incidents: true,
  departments: { include: _leoProperties.department.include },
  divisions: { include: unitProperties.division.include },
  situationCode: { include: { value: true } },
  type: { include: { value: true } },
  gtaMapPosition: true,
});
