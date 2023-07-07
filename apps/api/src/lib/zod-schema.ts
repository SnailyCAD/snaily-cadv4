import { useDecorators } from "@tsed/core";
import { Schema } from "@tsed/schema";
import { z } from "zod";
import { generateSchema } from "@anatine/zod-openapi";

export function ZodSchema(schema: z.ZodTypeAny) {
  const openApiSchema = generateSchema(schema);
  return useDecorators(Schema(openApiSchema));
}
