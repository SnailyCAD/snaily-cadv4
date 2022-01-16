import { z } from "zod";

export const handleValidate =
  <Values = any>(schema: any) =>
  (values: Values) => {
    const errors: Record<string, string> = {};

    try {
      schema.parse(values);
    } catch (e: any) {
      const zodError = e instanceof z.ZodError ? e : null;
      if (zodError) {
        for (const error of zodError.errors) {
          const [path] = error.path;
          errors[path as string] = error.message;
        }
      }
    }

    return errors;
  };
