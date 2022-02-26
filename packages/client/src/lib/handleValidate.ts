import type { z } from "zod";

type ZodSchema = z.ZodType<any, any, any>;
type Errors<Schema extends ZodSchema> = keyof z.infer<Schema>;

export function handleValidate<Schema extends ZodSchema, Values = any>(schema: Schema) {
  return function handleValidateInner(values: Values) {
    const errors: Record<string, string> = {};

    try {
      schema.parse(values);
    } catch (error: any) {
      const zodError: z.ZodError | null = "flatten" in error ? error : null;

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

    return errors as Record<Errors<Schema>, string | undefined>;
  };
}
