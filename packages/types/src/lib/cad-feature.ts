import * as Enums from "../enums";

export interface CadFeatureOptions {
  [Enums.Feature.LICENSE_EXAMS]: LicenseExamFeatureOption;
}

export type LicenseExamFeatureOption = Enums.LicenseExamType[];
