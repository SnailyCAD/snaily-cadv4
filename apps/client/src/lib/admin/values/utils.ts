import compareAsc from "date-fns/compareAsc";
import { type AnyValue, type PenalCodeGroup, type StatusValue, WhatPages } from "@snailycad/types";
import { hasValueObj, isBaseValue } from "@snailycad/utils";

export function sortValues<T extends AnyValue>(values: T[]): T[] {
  return values.sort((a, b) => {
    const { position: posA, createdAt: crA } = findCreatedAtAndPosition(a);
    const { position: posB, createdAt: crB } = findCreatedAtAndPosition(b);

    return typeof posA === "number" && typeof posB === "number"
      ? posA - posB
      : compareAsc(crA, crB);
  });
}

export function findCreatedAtAndPosition(value: AnyValue) {
  if (isBaseValue(value)) {
    return {
      createdAt: new Date(value.createdAt),
      position: value.position,
    };
  }

  if (hasValueObj(value)) {
    return {
      createdAt: new Date(value.value.createdAt),
      position: value.value.position,
    };
  }

  return {
    createdAt: new Date(value.createdAt),
    position: value.position,
  };
}

export function handleFilter(value: AnyValue, search: string) {
  if (!search) return true;
  const str = isBaseValue(value) ? value.value : hasValueObj(value) ? value.value.value : "";

  if (str.toLowerCase().includes(search.toLowerCase())) return true;
  return false;
}

export function getValueStrFromValue(value: AnyValue) {
  const isBase = isBaseValue(value);
  const hasObj = hasValueObj(value);
  return isBase ? value.value : hasObj ? value.value.value : value.title;
}

export function getCreatedAtFromValue(value: AnyValue) {
  const isBase = isBaseValue(value);
  const hasObj = hasValueObj(value);
  return isBase ? value.createdAt : hasObj ? value.value.createdAt : value.createdAt;
}

export function getDisabledFromValue(value: AnyValue) {
  const isBase = isBaseValue(value);
  const hasObj = hasValueObj(value);
  return isBase ? value.isDisabled : hasObj ? value.value.isDisabled : false;
}

/**
 * only update db if the list was actually moved.
 */
export function hasTableDataChanged(
  prevList: (AnyValue | PenalCodeGroup)[],
  newList: (AnyValue | PenalCodeGroup)[],
) {
  let wasMoved = false;

  for (let i = 0; i < prevList.length; i++) {
    if (prevList[i]?.id !== newList[i]?.id) {
      wasMoved = true;
      break;
    }
  }

  return wasMoved;
}

const DEFAULT_PAGES = [WhatPages.LEO, WhatPages.DISPATCH, WhatPages.EMS_FD];

export function makeDefaultWhatPages(
  status: (Omit<StatusValue, "whatPages"> & { whatPages: WhatPages[] | null }) | null,
) {
  if (!status) return [];
  const whatPages = status.whatPages ?? [];

  return whatPages.length <= 0 ? DEFAULT_PAGES : status.whatPages;
}
