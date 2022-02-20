import { prisma } from "lib/prisma";

const DEFAULT_SYMBOL = "A" as const;
const DEFAULT_TEMPLATE = "1A-{callsign2}";

export async function pairedSymbolToTemplate() {
  const settings = await prisma.miscCadSettings.findFirst({
    where: {
      NOT: {
        pairedUnitSymbol: DEFAULT_SYMBOL,
      },
    },
  });

  const shouldUpdate = settings && settings?.pairedUnitTemplate === DEFAULT_TEMPLATE;

  if (shouldUpdate) {
    await prisma.miscCadSettings.update({
      where: { id: settings.id },
      data: {
        pairedUnitTemplate: `1${settings.pairedUnitSymbol}-{callsign2}`,
        pairedUnitSymbol: "",
      },
    });
  }
}
