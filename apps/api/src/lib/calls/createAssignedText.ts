import type { handleDeleteAssignedUnit } from "./assignUnitsToCall";

interface Options {
  disconnectedUnits: NonNullable<Awaited<ReturnType<typeof handleDeleteAssignedUnit>>>[];
  connectedUnits: NonNullable<Awaited<ReturnType<typeof handleDeleteAssignedUnit>>>[];
}

export function createAssignedText(options: Options) {
  const connectedUnits = createTranslationData({ ...options, type: "connectedUnits" });
  const disconnectedUnits = createTranslationData({ ...options, type: "disconnectedUnits" });

  const data = [];

  for (const item of [connectedUnits, disconnectedUnits]) {
    if (!item) continue;
    data.push(item);
  }

  return data;
}

function createTranslationData(options: Options & { type: keyof Options }) {
  const units = options[options.type].map((unit) => ({
    ...unit,
    officer: undefined,
    deputy: undefined,
    combinedUnit: undefined,
    unit: unit.officer || unit.deputy || unit.combinedUnit,
  }));

  if (units.length <= 0) return;
  if (units.length === 1) {
    return {
      key: options.type === "connectedUnits" ? "unitAssignedToCall" : "unitUnassignedToCall",
      units,
    };
  }

  return {
    key: options.type === "connectedUnits" ? "unitsAssignedToCall" : "unitsUnassignedToCall",
    units,
  };
}
