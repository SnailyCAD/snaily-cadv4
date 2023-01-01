import type { Record } from "@snailycad/types";
import format from "date-fns/format";
import { prefixNumber } from "./utils/prefix-number";
import { replaceTemplateVariables } from "./utils/replace-template-variables";

type RecordPick = "caseNumber" | "createdAt" | "officer";

export type _Record = Pick<Record, RecordPick>;

/**
 * given a record and a template, format a case number for it
 * @param {_Record} record - The record object
 * @param {string | null} template - The template to use for the case number.
 * @returns the formatted callsign
 */
export function formatCaseNumber(record: _Record, template: string | null) {
  if (!template) {
    return `#${record.caseNumber}`;
  }

  const createdAt = new Date(record.createdAt);
  const prefixedCaseNumber = prefixNumber(record.caseNumber, 5);

  const replacers = {
    department: record.officer?.department?.callsign,
    month: format(createdAt, "MM"),
    year: format(createdAt, "yyyy"),
    day: format(createdAt, "dd"),
    id: prefixedCaseNumber,
  };

  return replaceTemplateVariables(template, replacers);
}
