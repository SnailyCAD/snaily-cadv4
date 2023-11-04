import Color from "color";

export function generateContrastColor(backgroundColor: string): string {
  try {
    const luminance = new Color(backgroundColor.trim()).luminosity();
    return luminance > 0.2 ? "#000000" : "#FFFFFF";
  } catch (err) {
    return "#FFFFFF";
  }
}

export function darkenColor(color: string, amount: number): string {
  try {
    return new Color(color.trim()).darken(amount).hex();
  } catch (err) {
    console.log(err);

    return color;
  }
}
