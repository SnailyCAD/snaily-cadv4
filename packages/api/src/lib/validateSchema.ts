import { ResponseErrorObject } from "@tsed/common";
import { BadRequest } from "@tsed/exceptions";
import { z } from "zod";

export function validateSchema<Extra extends object, Schema extends z.ZodType<any, any, any>>(
  schema: Schema,
  values: unknown,
): z.infer<Schema> & Extra {
  let data = {};
  const errors: Record<string, string> = {};

  try {
    data = schema.parse(values);
  } catch (e) {
    const zodError = e instanceof z.ZodError ? e : null;
    if (zodError) {
      for (const error of zodError.errors) {
        const [path] = error.path;
        errors[path as string] = error.message;
      }
    }
  }

  if (Object.values(errors).length > 0) {
    throw new InvalidSchema(errors);
  }

  return data as z.infer<Schema> & Extra;
}

class InvalidSchema extends BadRequest implements ResponseErrorObject {
  headers = {};
  errors = {};

  constructor(errors: Record<string, string>, message = "Invalid Schema") {
    super(message);
    this.errors = errors;
  }
}
