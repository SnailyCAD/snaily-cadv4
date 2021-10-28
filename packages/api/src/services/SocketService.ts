import * as SocketIO from "socket.io";
import { Nsp, SocketService } from "@tsed/socketio";
import { SocketEvents } from "@snailycad/config";
import { Call911, TowCall, Bolo, Call911Event, TaxiCall } from ".prisma/client";

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

  async emitUpdate911Call(call: Call911) {
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

  async emitCallDelete(call: TowCall) {
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

  emitPanicButtonLeo(officer: any) {
    this.io.sockets.emit(SocketEvents.PANIC_BUTTON, officer);
  }
}
