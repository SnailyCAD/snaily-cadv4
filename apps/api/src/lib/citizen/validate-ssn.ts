import { prisma } from "lib/data/prisma";
import { ExtendedBadRequest } from "src/exceptions/extended-bad-request";

interface ValidateSocialSecurityNumber {
  socialSecurityNumber: string;
  citizenId?: string;
}

export async function validateSocialSecurityNumber(options: ValidateSocialSecurityNumber) {
  const existing = await prisma.citizen.findFirst({
    where: {
      socialSecurityNumber: options.socialSecurityNumber,
      NOT: {
        id: options.citizenId,
      },
    },
  });

  if (existing) {
    throw new ExtendedBadRequest({ socialSecurityNumber: "socialSecurityNumberTaken" });
  }
}
