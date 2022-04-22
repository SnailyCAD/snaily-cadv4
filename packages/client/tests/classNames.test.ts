/* eslint-disable no-self-compare */
/* eslint-disable @typescript-eslint/no-unnecessary-condition */
/* eslint-disable quotes */
import { expect, test } from "vitest";
import { classNames } from "../src/lib/classNames";

test("Should join classes together", () => {
  const t = 0 === 0;
  const f = 0 !== 0;

  expect(
    classNames("hello world", t && "true-thing", f && "not-shown", t && null, undefined),
  ).toMatchInlineSnapshot('"hello world true-thing"');
});
