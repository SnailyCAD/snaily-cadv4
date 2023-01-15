import { prisma } from "lib/data/prisma";

const locales = {
  en_gb: "en-gb",
  fr_FRA: "fr-fr",
  de_DE: "de-de",
} as Record<string, string>;

export async function migrateLocales() {
  const users = await prisma.user.findMany({
    where: {
      OR: [{ locale: "en_gb" }, { locale: "fr_FRA" }, { locale: "de_DE" }],
    },
  });

  for (const user of users) {
    const newLocale = user.locale && locales[user.locale];
    if (!newLocale) continue;

    await prisma.user.update({
      where: { id: user.id },
      data: { locale: newLocale },
    });
  }
}
