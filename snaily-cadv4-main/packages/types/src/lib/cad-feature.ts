import type * as Enums from "../enums";

export interface CadFeatureOptions {
  [Enums.Feature.LICENSE_EXAMS]: LicenseExamFeatureOption;
  [Enums.Feature.COURTHOUSE]: CourthouseFeatureOption;
}

export type LicenseExamFeatureOption = Enums.LicenseExamType[];
export type CourthouseFeatureOption = Enums.CourthouseType[];
