import Color from "color";

export function generateContrastColor(backgroundColor: string): string {
  try {
    const luminance = new Color(backgroundColor.trim()).luminosity();
    return luminance > 0.2 ? "#000000" : "#FFFFFF";
  } catch (err) {
    return "#FFFFFF";
  }
}
