import { ZodError } from "zod";

export function validate<Values = any>(
  schema: any,
  values: Values,
  oneError?: false,
): Record<string, string>;
export function validate<Values = any>(schema: any, values: Values, oneError?: true): string;
export function validate<Values = any>(
  schema: any,
  values: Values,
  oneError = false,
): Record<string, string> | string {
  const errors: Record<string, string> = {};

  try {
    schema.parse(values);
  } catch (e) {
    const zodError = e instanceof ZodError ? e : null;
    if (zodError) {
      for (const error of zodError.errors) {
        const [path] = error.path;
        errors[path as string] = error.message;
      }
    }
  }

  return oneError ? Object.entries(errors).join(",") : errors;
}
