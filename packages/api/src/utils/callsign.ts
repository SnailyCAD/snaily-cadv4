import {
  DepartmentValue,
  DivisionValue,
  EmsFdDeputy,
  MiscCadSettings,
  Officer,
} from "@prisma/client";

type FullUnit = (Officer | EmsFdDeputy) & { department: DepartmentValue; division: DivisionValue };

export function generateCallsign(unit: FullUnit, miscCadSettings: MiscCadSettings | null) {
  if (!("department" in unit)) {
    return "NULL";
  }

  const { callsign, callsign2, department, division } = unit;
  const template = miscCadSettings?.callsignTemplate;

  if (!template) {
    return "";
  }

  const replacers = {
    department: department.callsign,
    callsign1: callsign,
    callsign2,
    division: division.callsign,
  };

  const templateArr: (string | null)[] = template.split(/[{}]/);
  Object.entries(replacers).forEach(([replacer, value]) => {
    const idx = templateArr.indexOf(replacer);

    if (value) {
      templateArr[idx] = value;
    } else {
      templateArr[idx] = null;
    }
  });

  return templateArr.filter((v) => v !== null).join("");
}
