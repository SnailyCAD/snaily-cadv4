import { prisma } from "lib/prisma";
import { ExtendedBadRequest } from "src/exceptions/ExtendedBadRequest";

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
