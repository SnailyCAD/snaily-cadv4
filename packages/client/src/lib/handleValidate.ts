export const handleValidate =
  <Values = any>(schema: any) =>
  (values: Values) => {
    const errors: Record<string, string> = {};

    try {
      schema.parse(values);
    } catch (e: any) {
      const errs = e?.issues ?? [];

      for (const error of errs) {
        const [path] = error.path;
        errors[path as string] = error.message;
      }
    }

    return errors;
  };
