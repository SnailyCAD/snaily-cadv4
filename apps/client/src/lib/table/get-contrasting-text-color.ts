import Color from "color";

export function generateContrastColor(backgroundColor: string): string {
  const luminance = new Color(backgroundColor.trim()).luminosity();
  return luminance > 0.5 ? "#000000" : "#FFFFFF";
}
