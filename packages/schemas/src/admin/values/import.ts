import { z } from "zod";

export const BASE_VALUE_SCHEMA = z.object({
  value: z.string().min(1).max(255),
});
export const BASE_ARR = z.array(BASE_VALUE_SCHEMA).min(1);

export const HASH_SCHEMA = BASE_VALUE_SCHEMA.extend({
  hash: z.string().max(255).optional(),
});

export const HASH_SCHEMA_ARR = z.array(HASH_SCHEMA).min(1);
