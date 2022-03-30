import * as SocketIO from "socket.io";
import { Nsp, SocketService } from "@tsed/socketio";
import { SocketEvents } from "@snailycad/config";
import type { LeoIncident, Call911, TowCall, Bolo, Call911Event, TaxiCall } from "@prisma/client";
import type { IncidentEvent } from "@snailycad/types";

type FullIncident = LeoIncident & { events?: IncidentEvent[] };

@SocketService("/")
export class Socket {
  @Nsp nsp!: SocketIO.Namespace;
  private io: SocketIO.Server;

  constructor(io: SocketIO.Server) {
    this.io = io;
  }

  async emit911Call(call: Call911) {
    this.io.sockets.emit(SocketEvents.Create911Call, call);
  }

  emitUpdateActiveIncident(incident: FullIncident) {
    this.io.sockets.emit(SocketEvents.UpdateActiveIncident, incident);
  }

  emitCreateActiveIncident(incident: FullIncident) {
    this.io.sockets.emit(SocketEvents.CreateActiveIncident, incident);
  }

  async emitUpdate911Call(call: Call911 & Record<string, any>) {
    this.io.sockets.emit(SocketEvents.Update911Call, call);
  }

  async emit911CallDelete(call: Call911) {
    this.io.sockets.emit(SocketEvents.End911Call, call);
  }

  async emitTowCall(call: TowCall) {
    this.io.sockets.emit(SocketEvents.CreateTowCall, call);
  }

  async emitUpdateTowCall(call: TowCall) {
    this.io.sockets.emit(SocketEvents.UpdateTowCall, call);
  }

  async emitTowCallEnd(call: TowCall) {
    this.io.sockets.emit(SocketEvents.EndTowCall, call);
  }

  async emitCreateBolo(bolo: Bolo) {
    this.io.sockets.emit(SocketEvents.CreateBolo, bolo);
  }

  async emitUpdateBolo(bolo: Bolo) {
    this.io.sockets.emit(SocketEvents.UpdateBolo, bolo);
  }

  async emitDeleteBolo(bolo: Bolo) {
    this.io.sockets.emit(SocketEvents.DeleteBolo, bolo);
  }

  emitUpdateAop(aop: string | null) {
    this.io.sockets.emit(SocketEvents.UpdateAreaOfPlay, aop);
  }

  emitUpdateRoleplayStopped(value: boolean) {
    this.io.sockets.emit(SocketEvents.RoleplayStopped, value);
  }

  emitUpdateOfficerStatus() {
    this.io.sockets.emit(SocketEvents.UpdateOfficerStatus);
  }

  emitUpdateDeputyStatus() {
    this.io.sockets.emit(SocketEvents.UpdateEmsFdStatus);
  }

  emitUserBanned(userId: string) {
    this.io.sockets.emit(SocketEvents.UserBanned, userId);
  }

  emitUserDeleted(userId: string) {
    this.io.sockets.emit(SocketEvents.UserDeleted, userId);
  }

  emitAddCallEvent(event: Call911Event) {
    this.io.sockets.emit(SocketEvents.AddCallEvent, event);
  }

  emitUpdateCallEvent(event: Call911Event) {
    this.io.sockets.emit(SocketEvents.UpdateCallEvent, event);
  }

  emitDeleteCallEvent(event: Call911Event) {
    this.io.sockets.emit(SocketEvents.DeleteCallEvent, event);
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

  emitPanicButtonLeo(officer: any, type?: "ON" | "OFF") {
    if (type === "OFF") {
      this.io.sockets.emit(SocketEvents.PANIC_BUTTON_OFF, officer);
    } else {
      this.io.sockets.emit(SocketEvents.PANIC_BUTTON_ON, officer);
    }
  }

  emitActiveDispatchers() {
    this.io.sockets.emit(SocketEvents.UpdateDispatchersState);
  }
}
