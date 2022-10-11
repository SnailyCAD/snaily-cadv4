import type { Prisma } from "@prisma/client";
import type { CREATE_CITIZEN_SCHEMA } from "@snailycad/schemas";
import { generateString } from "utils/generateString";
import { validateImgurURL } from "utils/image";

export function citizenObjectFromData(
  data: Zod.infer<typeof CREATE_CITIZEN_SCHEMA>,
  defaultLicenseValueId?: string | null,
) {
  let obj: Prisma.CitizenUncheckedCreateInput = {
    address: data.address,
    postal: data.postal || null,
    weight: data.weight,
    height: data.height,
    hairColor: data.hairColor,
    dateOfBirth: data.dateOfBirth,
    ethnicityId: data.ethnicity,
    name: data.name,
    surname: data.surname,
    genderId: data.gender,
    eyeColor: data.eyeColor,
    phoneNumber: data.phoneNumber || null,
    imageId: validateImgurURL(data.image),
    socialSecurityNumber: data.socialSecurityNumber || generateString(9, { numbersOnly: true }),
    occupation: data.occupation || null,
    additionalInfo: data.additionalInfo,
  };

  if (typeof defaultLicenseValueId !== "undefined") {
    obj = {
      ...obj,
      driversLicenseId: data.driversLicense || defaultLicenseValueId,
      weaponLicenseId: data.weaponLicense || defaultLicenseValueId,
      pilotLicenseId: data.pilotLicense || defaultLicenseValueId,
      waterLicenseId: data.waterLicense || defaultLicenseValueId,
    };
  }

  return obj;
}
