import { ZodError, ZodObject, ZodRawShape } from "zod";

export const handleValidate =
  <Values = any, T extends ZodRawShape = any>(schema: ZodObject<T>) =>
  (values: Values) => {
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

    return errors;
  };