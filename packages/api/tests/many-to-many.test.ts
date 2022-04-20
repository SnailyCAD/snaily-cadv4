import { expect, test } from "vitest";
import { getLastOfArray, merge, manyToManyHelper } from "../src/utils/manyToMany";

test("Should return correct many-to-many array ({id: Number}) for Prisma -> addition ", () => {
  const currentArr = [{ id: 1 }, { id: 2 }, { id: 3 }];
  const newArr = [{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }];

  expect(manyToManyHelper(currentArr, newArr, { accessor: "id" })).toMatchObject([
    {
      connect: {
        id: 4,
      },
    },
  ]);
});

test("Should return correct many-to-many array ({id: Number}) for Prisma -> disconnect", () => {
  const currentArr = [{ id: 1 }, { id: 2 }, { id: 3 }];
  const newArr = [{ id: 1 }, { id: 2 }];

  expect(manyToManyHelper(currentArr, newArr, { accessor: "id" })).toMatchObject([
    {
      disconnect: {
        id: 3,
      },
    },
  ]);
});

test("Should return correct many-to-many array ({id: Number}) for Prisma -> addition & disconnect", () => {
  const currentArr = [{ id: 1 }, { id: 2 }, { id: 3 }];
  const newArr = [{ id: 1 }, { id: 2 }, { id: 4 }];

  expect(manyToManyHelper(currentArr, newArr, { accessor: "id" })).toMatchInlineSnapshot(`
    [
      {
        "disconnect": {
          "id": 3,
        },
      },
      {
        "connect": {
          "id": 4,
        },
      },
    ]
  `);
});

test("Should return correct many-to-many array (id: String) for Prisma -> addition & disconnect", () => {
  const currentArr = ["a", "b", "c"];
  const newArr = ["a", "b", "d"];

  expect(manyToManyHelper(currentArr, newArr)).toMatchInlineSnapshot(`
    [
      {
        "disconnect": {
          "id": "c",
        },
      },
      {
        "connect": {
          "id": "d",
        },
      },
    ]
  `);
});

test("Should return correct many-to-many array (id: String) for Prisma -> addition & delete", () => {
  const currentArr = ["a", "b", "c"];
  const newArr = ["a", "b", "d"];

  const result = manyToManyHelper(currentArr, newArr, { disconnectType: "delete" });
  expect(result).toMatchInlineSnapshot(`
    [
      {
        "delete": {
          "id": "c",
        },
      },
      {
        "connect": {
          "id": "d",
        },
      },
    ]
  `);
});

test("Should merge 2 arrays -> 1 unique array without accessor", () => {
  const arr1 = ["A", "B", "C", "F"];
  const arr2 = ["A", "C", "D", "E"];

  expect(merge(arr1, arr2)).toMatchObject(["A", "B", "C", "F", "D", "E"]);
});

test("Should merge 2 arrays -> 1 unique array with accessor", () => {
  const arr1 = [{ id: "A" }, { id: "B" }, { id: "C" }];
  const arr2 = [{ id: "C" }, { id: "D" }, { id: "F" }];

  expect(merge(arr1, arr2, "id")).toMatchObject([
    { id: "A" },
    { id: "B" },
    { id: "C" },
    { id: "D" },
    { id: "F" },
  ]);
});

test("Should get last item of an array -> []", () => {
  expect(getLastOfArray([])).toBe(undefined);
});

test("Should get last item of an array -> Array(length: 10)", () => {
  const arr = new Array(10).fill({}).map((_, idx) => idx + 1);

  expect(getLastOfArray(arr)).toBe(10);
});
