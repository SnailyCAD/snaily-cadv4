import * as Enums from "../enums";

export type CadFeatureOptions = Record<Enums.Feature, Record<string, any>> & {
  [Enums.Feature.LICENSE_EXAMS]: LicenseExamFeatureOption;
};

export type LicenseExamFeatureOption = Enums.LicenseExamType[];
