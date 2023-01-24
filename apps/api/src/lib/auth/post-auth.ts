import { prisma } from "lib/data/prisma";

export interface PostLoginFlowOptions {
  userId: string;
}

export async function postLoginFlowHandler(options: PostLoginFlowOptions) {
  await prisma.user.update({
    where: { id: options.userId },
    data: { lastSeen: new Date() },
  });
}
