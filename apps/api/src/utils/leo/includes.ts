import { Prisma } from "@prisma/client";
import { userProperties } from "lib/auth/getSessionUser";

export const unitProperties = Prisma.validator<Prisma.EmsFdDeputySelect>()({
  department: { include: { value: true } },
  division: { include: { value: true, department: true } },
  status: { include: { value: true } },
  citizen: { select: { name: true, surname: true, id: true } },
  user: { select: userProperties },
  IncidentInvolvedUnit: { where: { incident: { isActive: true } }, select: { id: true } },
  whitelistStatus: { include: { department: { include: { value: true } } } },
  rank: true,
  activeVehicle: { include: { value: true } },
});

export const _leoProperties = Prisma.validator<Prisma.OfficerSelect>()({
  department: { include: { value: true } },
  divisions: { include: { value: true, department: true } },
  status: { include: { value: true } },
  citizen: { select: { name: true, surname: true, id: true } },
  whitelistStatus: { include: { department: { include: { value: true } } } },
  user: { select: userProperties },
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
