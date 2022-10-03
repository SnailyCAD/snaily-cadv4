import * as SocketIO from "socket.io";
import { Nsp, SocketService } from "@tsed/socketio";
import { SocketEvents } from "@snailycad/config";
import {
  LeoIncident,
  Call911,
  TowCall,
  Bolo,
  TaxiCall,
  ShouldDoType,
  Officer,
  CombinedLeoUnit,
  IncidentEvent,
  EmsFdDeputy,
  Warrant,
} from "@prisma/client";
import { prisma } from "lib/prisma";
import { combinedUnitProperties, leoProperties, unitProperties } from "lib/leo/activeOfficer";
import type { z } from "zod";
import type { TONES_SCHEMA } from "@snailycad/schemas";
import type { User } from "@snailycad/types";

type FullIncident = LeoIncident & { unitsInvolved: any[]; events?: IncidentEvent[] };

@SocketService("/")
export class Socket {
  @Nsp nsp!: SocketIO.Namespace;
  private io: SocketIO.Server;

  constructor(io: SocketIO.Server) {
    this.io = io;
  }

  emit911Call(call: Call911) {
    this.io.sockets.emit(SocketEvents.Create911Call, call);
  }

  emitUpdateActiveIncident(incident: FullIncident) {
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

  emit911CallDelete(call: Call911) {
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

  async emitUpdateOfficerStatus() {
    const [officers, units] = await prisma.$transaction([
      prisma.officer.findMany({
        orderBy: { updatedAt: "desc" },
        where: { status: { NOT: { shouldDo: ShouldDoType.SET_OFF_DUTY } } },
        include: leoProperties,
      }),
      prisma.combinedLeoUnit.findMany({
        include: combinedUnitProperties,
      }),
    ]);

    const data = [...officers, ...units];

    this.io.sockets.emit(SocketEvents.UpdateOfficerStatus, data);
  }

  async emitUpdateDeputyStatus() {
    const deputies = await prisma.emsFdDeputy.findMany({
      orderBy: { updatedAt: "desc" },
      where: { status: { NOT: { shouldDo: ShouldDoType.SET_OFF_DUTY } } },
      include: unitProperties,
    });

    this.io.sockets.emit(SocketEvents.UpdateEmsFdStatus, deputies);
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

  emitPanicButtonLeo(unit: CombinedLeoUnit | Officer | EmsFdDeputy | null, type?: "ON" | "OFF") {
    if (type === "OFF") {
      this.io.sockets.emit(SocketEvents.PANIC_BUTTON_OFF, unit);
    } else {
      this.io.sockets.emit(SocketEvents.PANIC_BUTTON_ON, unit);
    }
  }

  emitActiveDispatchers() {
    this.io.sockets.emit(SocketEvents.UpdateDispatchersState);
  }

  emitTones(data: z.infer<typeof TONES_SCHEMA> & { user: User }) {
    this.io.sockets.emit(SocketEvents.Tones, { ...data, user: { username: data.user.username } });
  }
}
