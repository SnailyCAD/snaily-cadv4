export const handleValidate =
  <Values = any>(schema: any) =>
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
