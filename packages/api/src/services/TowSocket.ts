import { TowCall } from ".prisma/client";
import { Nsp, SocketService } from "@tsed/socketio";
import * as SocketIO from "socket.io";
import { SocketEvents } from "@snailycad/config";

@SocketService("/tow")
export class TowSocket {
  @Nsp nsp!: SocketIO.Namespace;
  private io: SocketIO.Server;

  constructor(io: SocketIO.Server) {
    this.io = io;
  }

  async emitTowCall(call: TowCall) {
    this.io;
    this.nsp.emit(SocketEvents.CreateTowCall, call);
  }

  async emitUpdateTowCall(call: TowCall) {
    this.nsp.emit(SocketEvents.UpdateTowCall, call);
  }

  async emitCallDelete(call: TowCall) {
    this.nsp.emit(SocketEvents.EndTowCall, call);
  }
}
