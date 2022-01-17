export const handleValidate =
  <Values = any>(schema: any) =>
  (values: Values) => {
    const errors: Record<string, string> = {};

    try {
      schema.parse(values);
    } catch (e: any) {
      const errors = e?.errors ?? [];
      for (const error of errors) {
        const [path] = error.path;
        errors[path as string] = error.message;
      }
    }

    return errors;
  };
