import { test, expect } from "vitest";
import { hasPermission, Permissions, allPermissions } from "../src/index";

const manageUsers =
  Permissions.ViewUsers | Permissions.ManageUsers | Permissions.BanUsers | Permissions.DeleteUsers;

test("Should allow a user to manage/delete/ban a user", () => {
  expect(
    hasPermission(manageUsers, [
      Permissions.ViewUsers,
      Permissions.ManageUsers,
      Permissions.BanUsers,
      Permissions.DeleteUsers,
    ]),
  ).toBe(true);
});

test("Should not allow a user to manage/delete/ban a user", () => {
  expect(
    hasPermission(Permissions.ViewUsers, [
      Permissions.ManageUsers,
      Permissions.BanUsers,
      Permissions.DeleteUsers,
    ]),
  ).toBe(false);
});

test("Should not allow a user to delete a user", () => {
  expect(
    hasPermission(Permissions.ViewUsers | Permissions.ManageUsers, [Permissions.DeleteUsers]),
  ).toBe(false);
});

test("Should allow a user to delete x with 'allPermissions'", () => {
  expect(
    hasPermission(allPermissions, [
      Permissions.DeleteUsers,
      Permissions.DeleteUnits,
      Permissions.DeleteBusinesses,
    ]),
  ).toBe(true);
});

test("Should allow a user to ban/manage a user with 'allPermissions'", () => {
  expect(hasPermission(allPermissions, [Permissions.BanUsers, Permissions.ManageUsers])).toBe(true);
});
