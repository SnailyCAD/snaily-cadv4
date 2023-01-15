import type { Prisma, cad, CadFeature, MiscCadSettings } from "@prisma/client";
import type { CREATE_CITIZEN_SCHEMA } from "@snailycad/schemas";
import { generateString } from "utils/generate-string";
import generateBlurPlaceholder from "lib/images/generate-image-blur-data";
import { validateImageURL } from "lib/images/validate-image-url";

interface Options {
  data: Partial<Zod.infer<typeof CREATE_CITIZEN_SCHEMA>>;
  defaultLicenseValueId?: string | null;
  cad: cad & { features?: CadFeature[]; miscCadSettings: MiscCadSettings | null };
}

export async function citizenObjectFromData(options: Options) {
  const miscCadSettings = options.cad.miscCadSettings;
  const validatedImageURL = validateImageURL(options.data.image);

  let obj: Prisma.CitizenUncheckedCreateInput | Prisma.CitizenUncheckedUpdateInput = {
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
    imageId: validatedImageURL,
    imageBlurData: await generateBlurPlaceholder(validatedImageURL),
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

  return obj as Prisma.CitizenUncheckedCreateInput;
}
