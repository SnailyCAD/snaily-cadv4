import * as SocketIO from "socket.io";
import { Nsp, SocketService } from "@tsed/socketio";
import { SocketEvents } from "@snailycad/config";
import {
  type LeoIncident,
  type Call911,
  type TowCall,
  type Bolo,
  type TaxiCall,
  ShouldDoType,
  type Officer,
  type CombinedLeoUnit,
  type IncidentEvent,
  type EmsFdDeputy,
  type Warrant,
  type ActiveTone,
  type DispatchChat,
  type Citizen,
} from "@prisma/client";
import { prisma } from "lib/data/prisma";
import {
  combinedEmsFdUnitProperties,
  combinedUnitProperties,
  leoProperties,
  unitProperties,
} from "utils/leo/includes";
import { Injectable } from "@tsed/di";
import { generateCallsign } from "@snailycad/utils";
import { type MiscCadSettings } from "@snailycad/types";

type FullIncident = LeoIncident & { unitsInvolved: any[]; events?: IncidentEvent[] };

@SocketService("/")
@Injectable()
export class Socket {
  @Nsp nsp!: SocketIO.Namespace;
  private io: SocketIO.Server;

  constructor(io: SocketIO.Server) {
    this.io = io;
  }

  emit911Call(call: Call911) {
    this.io.sockets.emit(SocketEvents.Create911Call, call);
  }

  emitUpdateActiveIncident(incident: Partial<FullIncident>) {
    this.io.sockets.emit(SocketEvents.UpdateActiveIncident, incident);
  }

  emitCreateActiveIncident(incident: FullIncident) {
    this.io.sockets.emit(SocketEvents.CreateActiveIncident, incident);
  }

  emitCreateActiveWarrant(warrant: Warrant) {
    this.io.sockets.emit(SocketEvents.CreateActiveWarrant, warrant);
  }

  emitUpdateActiveWarrant(warrant: Warrant) {
    this.io.sockets.emit(SocketEvents.UpdateActiveWarrant, warrant);
  }

  emitUpdate911Call(call: Call911 & Record<string, any>) {
    this.io.sockets.emit(SocketEvents.Update911Call, call);
  }

  emit911CallDelete(call: Partial<Call911>) {
    this.io.sockets.emit(SocketEvents.End911Call, call);
  }

  emitTowCall(call: TowCall) {
    this.io.sockets.emit(SocketEvents.CreateTowCall, call);
  }

  emitUpdateTowCall(call: TowCall) {
    this.io.sockets.emit(SocketEvents.UpdateTowCall, call);
  }

  emitTowCallEnd(call: TowCall) {
    this.io.sockets.emit(SocketEvents.EndTowCall, call);
  }

  emitCreateBolo(bolo: Bolo) {
    this.io.sockets.emit(SocketEvents.CreateBolo, bolo);
  }

  emitUpdateBolo(bolo: Bolo) {
    this.io.sockets.emit(SocketEvents.UpdateBolo, bolo);
  }

  emitDeleteBolo(bolo: Bolo) {
    this.io.sockets.emit(SocketEvents.DeleteBolo, bolo);
  }

  emitUpdateAop(aop: string | null) {
    this.io.sockets.emit(SocketEvents.UpdateAreaOfPlay, aop);
  }

  emitUpdateRoleplayStopped(value: boolean) {
    this.io.sockets.emit(SocketEvents.RoleplayStopped, value);
  }

  emitSetUnitOffDuty(unitId: string) {
    this.io.sockets.emit(SocketEvents.SetUnitOffDuty, unitId);
  }

  async emitUpdateOfficerStatus() {
    const [officers, units] = await prisma.$transaction([
      prisma.officer.findMany({
        orderBy: { updatedAt: "desc" },
        where: { status: { NOT: { shouldDo: ShouldDoType.SET_OFF_DUTY } } },
        include: leoProperties,
      }),
      prisma.combinedLeoUnit.findMany({
        orderBy: { updatedAt: "desc" },
        include: combinedUnitProperties,
      }),
    ]);

    const data = [...units, ...officers];

    this.io.sockets.emit(SocketEvents.UpdateOfficerStatus, data);
  }

  async emitUpdateUnitStatus(unit: any) {
    this.io.sockets.emit(SocketEvents.UpdateUnitStatus, unit);
  }

  async emitUpdateDeputyStatus() {
    const [deputies, combinedEmsFdDeputies] = await prisma.$transaction([
      prisma.emsFdDeputy.findMany({
        orderBy: { updatedAt: "desc" },
        where: {
          status: { NOT: { shouldDo: ShouldDoType.SET_OFF_DUTY } },
        },
        include: unitProperties,
      }),
      prisma.combinedEmsFdUnit.findMany({
        orderBy: { updatedAt: "desc" },
        include: combinedEmsFdUnitProperties,
      }),
    ]);

    this.io.sockets.emit(SocketEvents.UpdateEmsFdStatus, [...combinedEmsFdDeputies, ...deputies]);
  }

  emitUserBanned(userId: string) {
    this.io.sockets.emit(SocketEvents.UserBanned, userId);
  }

  emitUserDeleted(userId: string) {
    this.io.sockets.emit(SocketEvents.UserDeleted, userId);
  }

  emitCreateTaxiCall(call: TaxiCall) {
    this.io.sockets.emit(SocketEvents.CreateTaxiCall, call);
  }

  emitUpdateTaxiCall(call: TaxiCall) {
    this.io.sockets.emit(SocketEvents.UpdateTaxiCall, call);
  }

  emitDeleteTaxiCall(call: TaxiCall) {
    this.io.sockets.emit(SocketEvents.EndTaxiCall, call);
  }

  emitSignal100(value: boolean) {
    this.io.sockets.emit(SocketEvents.Signal100, value);
  }

  emitPanicButtonLeo(
    unit:
      | CombinedLeoUnit
      | (Officer & { citizen: Pick<Citizen, "name" | "surname"> })
      | (EmsFdDeputy & { citizen: Pick<Citizen, "name" | "surname"> })
      | null,
    miscCadSettings: MiscCadSettings,
    type?: "ON" | "OFF",
  ) {
    if (type === "OFF") {
      this.io.sockets.emit(SocketEvents.PANIC_BUTTON_OFF, unit);
    } else {
      const unitName =
        unit && "citizen" in unit ? `${unit.citizen.name} ${unit.citizen.surname}` : "";

      const officerCallsign = unit
        ? generateCallsign(unit as any, miscCadSettings.callsignTemplate)
        : "";

      const formattedUnitData = unit ? `${officerCallsign} ${unitName}` : "";

      this.io.sockets.emit(SocketEvents.PANIC_BUTTON_ON, { ...unit, formattedUnitData });
    }
  }

  emitActiveDispatchers() {
    this.io.sockets.emit(SocketEvents.UpdateDispatchersState);
  }

  emitTones(data: ActiveTone & { createdBy: { username: string } }) {
    this.io.sockets.emit(SocketEvents.Tones, {
      ...data,
      user: { username: data.createdBy.username },
    });
  }

  emitPrivateMessage(unitId: string, chat: DispatchChat) {
    this.io.sockets.emit(SocketEvents.PrivateMessage, { unitId, chat });
  }
}
