import { ZodObject, ZodRawShape } from "zod";

export const handleValidate =
  <Values = any, T extends ZodRawShape = any>(schema: ZodObject<T>) =>
  (values: Values) => {
    const errors: Record<string, string> = {};

    try {
      schema.parse(values);
    } catch (e: any) {
      for (const error of e.errors) {
        const [path] = error.path;
        errors[path as string] = error.message;
      }
    }

    return errors;
  };
