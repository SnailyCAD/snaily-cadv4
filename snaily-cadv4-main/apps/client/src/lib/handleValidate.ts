import type { z } from "zod";

type ZodSchema = z.ZodType;
type Errors<Schema extends ZodSchema> = keyof z.infer<Schema>;

export function handleValidate<Schema extends ZodSchema, Values = any>(schema: Schema) {
  return function handleValidateInner(values: Values) {
    const errors: Record<string, string> = {};

    try {
      schema.parse(values);
    } catch (error: any) {
      const zodError: z.ZodError | null = "flatten" in error ? error : null;

      if (zodError) {
        const fieldErrors = zodError.issues;

        for (const fieldError of fieldErrors) {
          const path = fieldError.path;

          // a nested field
          if (path.length > 1) {
            const [rootFieldName, nestedField] = path as [string, string];
            const rootField = errors[rootFieldName] ?? {};

            Object.assign(errors, {
              [rootFieldName]: {
                ...rootField,
                [nestedField]: fieldError.message,
              },
            });

            // errors[rootField][nestedField] = fieldError.message;
          } else {
            const [field] = path as [string];
            errors[field] = fieldError.message;
          }
        }
      }
    }

    return errors as Record<Errors<Schema>, string | undefined>;
  };
}
