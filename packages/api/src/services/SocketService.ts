import { TowCall } from ".prisma/client";
import { Nsp, SocketService } from "@tsed/socketio";
import * as SocketIO from "socket.io";
import { SocketEvents } from "@snailycad/config";

@SocketService("/")
export class CadSocketService {
  @Nsp nsp!: SocketIO.Namespace;
  private io: SocketIO.Server;

  constructor(io: SocketIO.Server) {
    this.io = io;
  }

  //   $onConnection(@Socket socket: SocketIO.Socket, @SocketSession session: SocketSession) {}

  async emitTowCall(call: TowCall) {
    this.io;
    this.nsp.emit(SocketEvents.CreateTowCall, { data: call });
  }
}
