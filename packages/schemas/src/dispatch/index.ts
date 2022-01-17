import { z } from "zod";

export * from "./911-calls";
export * from "./bolos";

export const UPDATE_AOP_SCHEMA = z.object({
  aop: z.string().min(1).max(255),
});
