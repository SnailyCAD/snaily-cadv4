export function replaceTemplateVariables(
  template: string,
  replacers: Record<string, string | number | null | undefined>,
) {
  const templateArr: (string | null)[] = template.split(/[{}]/);

  Object.entries(replacers).forEach(([replacer, value]) => {
    const idx = templateArr.indexOf(replacer);

    if (value) {
      templateArr[idx] = value.toString();
    } else {
      templateArr[idx] = null;
    }
  });

  return templateArr.filter((v) => v !== null).join("");
}
