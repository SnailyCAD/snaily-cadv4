import type { Prisma } from "@prisma/client";
import type { CREATE_CITIZEN_SCHEMA } from "@snailycad/schemas";
import type { cad } from "@snailycad/types";
import { generateString } from "utils/generateString";
import { validateImgurURL } from "utils/image";

interface Options {
  data: Zod.infer<typeof CREATE_CITIZEN_SCHEMA>;
  defaultLicenseValueId?: string | null;
  cad: cad;
}

export function citizenObjectFromData(options: Options) {
  const miscCadSettings = options.cad.miscCadSettings;

  let obj: Prisma.CitizenUncheckedCreateInput = {
    address: options.data.address,
    postal: options.data.postal || null,
    weight: options.data.weight,
    height: options.data.height,
    hairColor: options.data.hairColor,
    dateOfBirth: options.data.dateOfBirth,
    ethnicityId: options.data.ethnicity,
    name: options.data.name,
    surname: options.data.surname,
    genderId: options.data.gender,
    eyeColor: options.data.eyeColor,
    phoneNumber: options.data.phoneNumber || null,
    imageId: validateImgurURL(options.data.image),
    socialSecurityNumber:
      options.data.socialSecurityNumber || generateString(9, { numbersOnly: true }),
    occupation: options.data.occupation || null,
    additionalInfo: options.data.additionalInfo,
    driversLicenseNumber: generateString(miscCadSettings?.driversLicenseNumberLength ?? 8),
    weaponLicenseNumber: generateString(miscCadSettings?.weaponLicenseNumberLength ?? 8, {
      numbersOnly: true,
    }),
    pilotLicenseNumber: generateString(miscCadSettings?.pilotLicenseNumberLength ?? 8, {
      numbersOnly: true,
    }),
    waterLicenseNumber: generateString(miscCadSettings?.waterLicenseNumberLength ?? 8, {
      numbersOnly: true,
    }),
  };

  if (typeof options.defaultLicenseValueId !== "undefined") {
    obj = {
      ...obj,
      driversLicenseId: options.data.driversLicense || options.defaultLicenseValueId,
      weaponLicenseId: options.data.weaponLicense || options.defaultLicenseValueId,
      pilotLicenseId: options.data.pilotLicense || options.defaultLicenseValueId,
      waterLicenseId: options.data.waterLicense || options.defaultLicenseValueId,
    };
  }

  return obj;
}
