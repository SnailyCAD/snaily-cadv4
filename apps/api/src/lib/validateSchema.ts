import { ExtendedBadRequest } from "src/exceptions/ExtendedBadRequest";
import { z } from "zod";

export function validateSchema<Extra extends object, Schema extends z.ZodType<any, any, any>>(
  schema: Schema,
  values: unknown,
): z.infer<Schema> & Extra {
  let data = {};
  const errors: Record<string, string> = {};

  try {
    data = schema.parse(values);
  } catch (error) {
    const zodError = error instanceof z.ZodError ? error : null;

    if (zodError) {
      const { fieldErrors } = zodError.flatten();

      for (const fieldError in fieldErrors) {
        const [errorMessage] = fieldErrors[fieldError] ?? [];
        if (errorMessage) {
          errors[fieldError] = errorMessage;
        }
      }
    }
  }

  if (Object.values(errors).length > 0) {
    throw new ExtendedBadRequest(errors);
  }

  return data as z.infer<Schema> & Extra;
}
