import { TableActionsAlignment } from "@snailycad/types";
import { expect, test } from "vitest";
import { makeColumns } from "../src/lib/table/orderColumnsByTableActionsAlignment";

const COLUMNS = [
  { accessorKey: "name" },
  { accessorKey: "surname" },
  { accessorKey: "age" },
  { accessorKey: "actions" },
] as any;

const LEFT = TableActionsAlignment.LEFT;
const RIGHT = TableActionsAlignment.RIGHT;
const NONE = TableActionsAlignment.NONE;

test("Should correctly order table alignment LEFT", () => {
  expect(makeColumns(LEFT, COLUMNS)).toMatchInlineSnapshot(`
    [
      {
        "accessor": "actions",
      },
      {
        "accessor": "name",
      },
      {
        "accessor": "surname",
      },
      {
        "accessor": "age",
      },
    ]
  `);
});

test("Should correctly order table alignment RIGHT", () => {
  expect(makeColumns(RIGHT, COLUMNS)).toMatchInlineSnapshot(`
    [
      {
        "accessor": "name",
      },
      {
        "accessor": "surname",
      },
      {
        "accessor": "age",
      },
      {
        "accessor": "actions",
      },
    ]
  `);
});

test("Should correctly order table alignment NONE", () => {
  expect(makeColumns(NONE, COLUMNS)).toMatchInlineSnapshot(`
    [
      {
        "accessor": "name",
      },
      {
        "accessor": "surname",
      },
      {
        "accessor": "age",
      },
      {
        "accessor": "actions",
      },
    ]
  `);
});
