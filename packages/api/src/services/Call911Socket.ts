import { Nsp, SocketService } from "@tsed/socketio";
import * as SocketIO from "socket.io";
import { SocketEvents } from "@snailycad/config";
import { Call911 } from ".prisma/client";

@SocketService("/911-calls")
export class Call911Socket {
  @Nsp nsp!: SocketIO.Namespace;
  private io: SocketIO.Server;

  constructor(io: SocketIO.Server) {
    this.io = io;
  }

  async emit911Call(call: Call911) {
    this.io;
    this.nsp.emit(SocketEvents.Create911Call, call);
  }

  async emitUpdate911Call(call: Call911) {
    this.nsp.emit(SocketEvents.Update911Call, call);
  }

  async emit911CallDelete(call: Call911) {
    this.nsp.emit(SocketEvents.End911Call, call);
  }
}
