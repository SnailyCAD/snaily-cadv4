import { TableActionsAlignment } from "@snailycad/types";
import { expect, test } from "vitest";
import { orderColumnsByTableActionsAlignment } from "../src/lib/table/orderColumnsByTableActionsAlignment";

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
  expect(orderColumnsByTableActionsAlignment(LEFT, COLUMNS)).toMatchInlineSnapshot(`
    [
      {
        "accessorKey": "actions",
      },
      {
        "accessorKey": "name",
      },
      {
        "accessorKey": "surname",
      },
      {
        "accessorKey": "age",
      },
    ]
  `);
});

test("Should correctly order table alignment RIGHT", () => {
  expect(orderColumnsByTableActionsAlignment(RIGHT, COLUMNS)).toMatchInlineSnapshot(`
    [
      {
        "accessorKey": "name",
      },
      {
        "accessorKey": "surname",
      },
      {
        "accessorKey": "age",
      },
      {
        "accessorKey": "actions",
      },
    ]
  `);
});

test("Should correctly order table alignment NONE", () => {
  expect(orderColumnsByTableActionsAlignment(NONE, COLUMNS)).toMatchInlineSnapshot(`
    [
      {
        "accessorKey": "name",
      },
      {
        "accessorKey": "surname",
      },
      {
        "accessorKey": "age",
      },
      {
        "accessorKey": "actions",
      },
    ]
  `);
});
