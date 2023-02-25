import type * as Prisma from "@prisma/client";
import type * as Types from "../index.js";

/** ems-fd search */
/**
 * @method POST
 * @route /search/medical-records
 */
export type PostEmsFdMedicalRecordsSearchData =
  | (Types.Citizen & {
      officers?: (Prisma.Officer & { department: Prisma.DepartmentValue | null })[] | undefined;
      medicalRecords: Types.MedicalRecord[];
      isConfidential: false;
    })
  | (Pick<
      Prisma.Citizen,
      "id" | "name" | "surname" | "imageId" | "imageBlurData" | "socialSecurityNumber"
    > & {
      isConfidential: true;
    });

/** dispatch search */
/**
 * @method POST
 * @route /search/address
 */
export type PostDispatchAddressSearchData = (Prisma.Citizen & {
  warrants: Prisma.Warrant[];
})[];

/** leo search */
/**
 * @method POST
 * @route /search/name
 */
export type PostLeoSearchCitizenData = (
  | (Types.Citizen & {
      officers?: (Prisma.Officer & { department: Prisma.DepartmentValue | null })[] | undefined;
      isConfidential: false;
      allCustomFields: Types.CustomField[];
      customFields: Types.CustomFieldValue[];
      warrants: Types.Warrant[];
      vehicles: NonNullable<PostLeoSearchVehicleData>[];
      weapons: Types.Weapon[];
      notes: Types.Note[];
      Record: Types.Record[];
      addressFlags: Types.Value[];
    })
  | (Pick<
      Types.Citizen,
      "id" | "name" | "surname" | "imageId" | "imageBlurData" | "socialSecurityNumber"
    > & {
      isConfidential: true;
    })
)[];

/**
 * @method POST
 * @route /search/weapon
 */
export type PostLeoSearchWeaponData =
  | (Prisma.Weapon & {
      customFields: Types.CustomFieldValue[];
      allCustomFields: Types.CustomField[];
      citizen: Prisma.Citizen;
      model: Types.WeaponValue;
      registrationStatus: Prisma.Value;
    })
  | null;

/**
 * @method POST
 * @route /search/vehicle
 */
export type PostLeoSearchVehicleData =
  | (Types.RegisteredVehicle & {
      customFields: Types.CustomFieldValue[];
      allCustomFields: Types.CustomField[];
      TruckLog: Prisma.TruckLog[];
    })
  | null;

export type PostLeoSearchBusinessData = (Types.Business & {
  citizen: Types.BaseCitizen;
  vehicles: Types.RegisteredVehicle[];
  employees: Types.Employee[];
  Record: Types.Record[];
})[];

/**
 * @method POST
 * @route /search/custom-field
 */
export interface PostSearchCustomFieldData<IsLeo extends boolean> {
  field: Prisma.CustomField | null;
  results: (
    | (IsLeo extends true ? Types.Citizen : Prisma.Citizen)
    | PostLeoSearchVehicleData
    | PostLeoSearchWeaponData
  )[];
}

/** search actions */
/**
 * @method PUT
 * @route /search/actions/licenses/:citizenId
 */
export type PutSearchActionsLicensesData = Types.Citizen;

/**
 * @method PUT
 * @route /search/actions/vehicle-licenses/:vehicleId
 */
export type PutSearchActionsVehicleLicensesData = PostLeoSearchVehicleData;

/**
 * @method PUT
 * @route /search/actions/vehicle-flags/:vehicleId
 */
export type PutSearchActionsVehicleFlagsData = Pick<Types.RegisteredVehicle, "id" | "flags">;

/**
 * @method PUT
 * @route /search/actions/citizen-flags/:citizenId
 */
export type PutSearchActionsCitizenFlagsData = Pick<Types.Citizen, "id" | "flags">;

/**
 * @method PUT
 * @route /search/actions/citizen-flags/:citizenId
 */
export type PutSearchActionsCitizenAddressFlagsData = Pick<Types.Citizen, "id"> & {
  addressFlags: Types.Value[];
};

/**
 * @method PUT
 * @route /search/actions/custom-fields/citizen/:citizenId
 */
export interface PutSearchActionsUpdateCitizenCustomFields {
  id: Types.Citizen["id"];
  customFields: Types.CustomFieldValue[];
}

/**
 * @method PUT
 * @route /search/actions/custom-fields/vehicle/:vehicleId
 */
export interface PutSearchActionsUpdateVehicleCustomFields {
  id: Types.RegisteredVehicle["id"];
  customFields: Types.CustomFieldValue[];
}

/**
 * @method PUT
 * @route /search/actions/custom-fields/weapon/:weaponId
 */
export interface PutSearchActionsUpdateWeaponCustomFields {
  id: Types.Weapon["id"];
  customFields: Types.CustomFieldValue[];
}

/**
 * @method POST
 * @route /search/actions/citizen
 */
export type PostSearchActionsCreateCitizen = PostLeoSearchCitizenData[number];

/**
 * @method POST
 * @route /search/actions/vehicle
 */
export type PostSearchActionsCreateVehicle = PostLeoSearchVehicleData;

/**
 * @method POST
 * @route /search/actions/vehicle
 */
export type PostLEODeclareCitizenMissing = Prisma.Citizen;
