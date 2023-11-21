import { BadRequest } from "@tsed/exceptions";
import { ExtendedBadRequest } from "~/exceptions/extended-bad-request";
import { type z } from "zod";

export function validateSchema<Schema extends z.ZodTypeAny>(
  schema: Schema,
  values: unknown,
): z.infer<Schema> {
  const data = schema.safeParse(values);

  if (!data.success) {
    const zodError = data.error;
    const errors: Record<string, string> = {};

    const { fieldErrors } = zodError.flatten();
    for (const fieldError in fieldErrors) {
      const [errorMessage] = fieldErrors[fieldError] ?? [];
      if (errorMessage) {
        errors[fieldError] = errorMessage;
      }
    }

    if (Object.values(errors).length > 0) {
      throw new ExtendedBadRequest(errors);
    }

    throw new BadRequest(JSON.stringify(zodError.message));
  }

  return data.data;
}
