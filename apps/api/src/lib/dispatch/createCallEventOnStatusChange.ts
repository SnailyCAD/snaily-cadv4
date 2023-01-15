import type { StatusValue } from "@prisma/client";
import { ShouldDoType } from "@snailycad/types";
import { callInclude } from "controllers/dispatch/911-calls/Calls911Controller";
import { officerOrDeputyToUnit } from "lib/leo/officerOrDeputyToUnit";
import { prisma } from "lib/data/prisma";
import type { Socket } from "services/socket-service";

interface Options {
  socket: Socket;
  status: StatusValue;
  unit: any;
}

export async function createCallEventOnStatusChange(options: Options) {
  const translationKeys = {
    [ShouldDoType.PANIC_BUTTON]: "unitPressedPanicButton",
    [ShouldDoType.ON_SCENE]: "unitOnScene",
    [ShouldDoType.EN_ROUTE]: "unitEnRoute",
  } as Record<ShouldDoType, string>;
  const key = translationKeys[options.status.shouldDo];

  if (key) {
    const call = await prisma.call911.update({
      include: callInclude,
      where: {
        id: options.unit.activeCallId,
      },
      data: {
        events: {
          create: {
            description: key,
            translationData: {
              key,
              units: [{ ...options.unit, unit: options.unit }],
            } as any,
          },
        },
      },
    });

    options.socket.emitUpdate911Call(officerOrDeputyToUnit(call));
  }
}
