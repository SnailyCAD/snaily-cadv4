import { ZodError, ZodObject, ZodRawShape } from "zod";

export function validate<TObj extends ZodRawShape, Values = any>(
  schema: ZodObject<TObj>,
  values: Values,
  oneError?: false,
): Record<string, string>;
export function validate<TObj extends ZodRawShape, Values = any>(
  schema: ZodObject<TObj>,
  values: Values,
  oneError?: true,
): string;
export function validate<TObj extends ZodRawShape, Values = any>(
  schema: ZodObject<TObj>,
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
