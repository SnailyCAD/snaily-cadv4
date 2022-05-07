/* eslint-disable quotes */
import { expect, test } from "vitest";
import { generateCallsign } from "../src/callsign";

// simple test data
export const OFFICER = {
  callsign: "E",
  callsign2: "92",
  citizen: { name: "john", surname: "doe" },
  badgeNumber: 6034,
  department: { value: { value: "LSPD" }, callsign: "A" },
  divisions: [{ value: { value: "Patrol" }, callsign: "P" }],
  citizenId: "xxxxx",
} as any;

export const EMS_FD_DEPUTY = {
  callsign: "E",
  callsign2: "92",
  citizen: { name: "john", surname: "doe" },
  badgeNumber: 6034,
  department: { value: { value: "LSPD" }, callsign: "A" },
  division: { value: { value: "Patrol" }, callsign: "P" },
  citizenId: "xxxxx",
} as any;

export const COMBINED_UNIT = {
  callsign: OFFICER.callsign,
  callsign2: OFFICER.callsign2,
  department: OFFICER.department,
  officers: [OFFICER],
} as any;

export const COMBINED_UNIT_WITH_TEMPLATE = {
  ...COMBINED_UNIT,
  incremental: 2,
  pairedUnitTemplate: "TROJAN-{incremental}",
};

const DEFAULT_TEMPLATE = "{department}{callsign1} - {callsign2}{division}";
const PAIRED_UNIT_TEMPLATE = "1A-{callsign1}";

test(`should generate LEO callsign template: ${DEFAULT_TEMPLATE}`, () => {
  expect(generateCallsign(OFFICER, DEFAULT_TEMPLATE)).toMatchInlineSnapshot('"AE - 92P"');
});

test(`should generate EMS/FD callsign template: ${DEFAULT_TEMPLATE}`, () => {
  expect(generateCallsign(EMS_FD_DEPUTY, DEFAULT_TEMPLATE)).toMatchInlineSnapshot('"AE - 92P"');
});

test(`should generate paired unit callsign template: ${PAIRED_UNIT_TEMPLATE}`, () => {
  expect(generateCallsign(COMBINED_UNIT, PAIRED_UNIT_TEMPLATE)).toMatchInlineSnapshot('"1A-E"');
});

test(`should generate paired unit callsign template: ${COMBINED_UNIT_WITH_TEMPLATE.pairedUnitTemplate}`, () => {
  expect(
    generateCallsign(COMBINED_UNIT_WITH_TEMPLATE, COMBINED_UNIT_WITH_TEMPLATE.pairedUnitTemplate),
  ).toMatchInlineSnapshot('"TROJAN-2"');
});

test(`should return "" if template === null`, () => {
  expect(generateCallsign(COMBINED_UNIT, null)).toMatchInlineSnapshot('""');
});
