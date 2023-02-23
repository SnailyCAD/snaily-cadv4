import { Prisma, cad, Feature, MiscCadSettings } from "@prisma/client";
import type { CREATE_CITIZEN_SCHEMA } from "@snailycad/schemas";
import { generateString } from "utils/generate-string";
import generateBlurPlaceholder from "lib/images/generate-image-blur-data";
import { validateImageURL } from "lib/images/validate-image-url";
import { generateLicenseNumber } from "./generate-license-number";
import { isFeatureEnabled } from "./cad";

interface Options {
  data: Partial<Zod.infer<typeof CREATE_CITIZEN_SCHEMA>>;
  defaultLicenseValueId?: string | null;
  cad: cad & { features?: Record<Feature, boolean>; miscCadSettings: MiscCadSettings | null };
}

export async function citizenObjectFromData(options: Options) {
  const miscCadSettings = options.cad.miscCadSettings;
  const validatedImageURL = validateImageURL(options.data.image);

  const isEditableSSNEnabled = isFeatureEnabled({
    features: options.cad.features,
    feature: Feature.EDITABLE_SSN,
    defaultReturn: true,
  });

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
      options.data.socialSecurityNumber && isEditableSSNEnabled
        ? options.data.socialSecurityNumber
        : generateString(9, { type: "numbers-only" }),
    occupation: options.data.occupation || null,
    additionalInfo: options.data.additionalInfo,

    driversLicenseNumber: generateLicenseNumber({
      template: miscCadSettings?.driversLicenseTemplate,
      length: miscCadSettings?.driversLicenseNumberLength ?? 8,
    }),

    pilotLicenseNumber: generateLicenseNumber({
      template: miscCadSettings?.pilotLicenseTemplate,
      length: miscCadSettings?.pilotLicenseNumberLength ?? 8,
    }),

    weaponLicenseNumber: generateLicenseNumber({
      template: miscCadSettings?.weaponLicenseTemplate,
      length: miscCadSettings?.weaponLicenseNumberLength ?? 8,
    }),

    waterLicenseNumber: generateLicenseNumber({
      template: miscCadSettings?.waterLicenseTemplate,
      length: miscCadSettings?.waterLicenseNumberLength ?? 8,
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
