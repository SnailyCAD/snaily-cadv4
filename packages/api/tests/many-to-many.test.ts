import { expect, test } from "vitest";
import { getLastOfArray, manyToManyHelper } from "../src/utils/manyToMany";

test("Should return correct many-to-many array ({id: Number}) for Prisma -> addition ", () => {
  const currentArr = [{ id: 1 }, { id: 2 }, { id: 3 }];
  const newArr = [{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }];

  expect(manyToManyHelper(currentArr, newArr, "id")).toMatchObject([
    {
      connect: {
        id: 4,
      },
    },
  ]);
});

test("Should return correct many-to-many array ({id: Number}) for Prisma -> deletion", () => {
  const currentArr = [{ id: 1 }, { id: 2 }, { id: 3 }];
  const newArr = [{ id: 1 }, { id: 2 }];

  expect(manyToManyHelper(currentArr, newArr, "id")).toMatchObject([
    {
      disconnect: {
        id: 3,
      },
    },
  ]);
});

test("Should return correct many-to-many array ({id: Number}) for Prisma -> addition & deletion", () => {
  const currentArr = [{ id: 1 }, { id: 2 }, { id: 3 }];
  const newArr = [{ id: 1 }, { id: 2 }, { id: 4 }];

  expect(manyToManyHelper(currentArr, newArr, "id")).toMatchInlineSnapshot(`
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

test("Should return correct many-to-many array (id: String) for Prisma -> addition & deletion", () => {
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

test("Should get last item of an array -> []", () => {
  expect(getLastOfArray([])).toBe(undefined);
});

test("Should get last item of an array -> Array(length: 10)", () => {
  const arr = new Array(10).fill({}).map((_, idx) => idx + 1);

  expect(getLastOfArray(arr)).toBe(10);
});
