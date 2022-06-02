import { test, expect } from "vitest";
import { allDefaultAdminPermissions } from "../src/defaults";
import {
  hasPermission,
  Permissions,
  allPermissions,
  getPermissions,
  defaultPermissions,
} from "../src/index";

const manageUsers = [
  Permissions.ViewUsers,
  Permissions.ManageUsers,
  Permissions.BanUsers,
  Permissions.DeleteUsers,
];

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

test("Should NOT be allowed to manage/delete/ban a user", () => {
  expect(hasPermission(manageUsers, defaultPermissions.defaultTowPermissions)).toBe(false);
});

test("Should not allow a user to manage/delete/ban a user", () => {
  expect(
    hasPermission(
      [Permissions.ViewUsers],
      [Permissions.ManageUsers, Permissions.BanUsers, Permissions.DeleteUsers],
    ),
  ).toBe(false);
});

test("Should not allow a user to delete a user", () => {
  expect(
    hasPermission([Permissions.ViewUsers, Permissions.ManageUsers], [Permissions.DeleteUsers]),
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

test("Should allow a user to manage name change requests (Navbar tests)", () => {
  expect(hasPermission(allDefaultAdminPermissions, [Permissions.ViewNameChangeRequests])).toBe(
    true,
  );
});

test("Should allow a user to manage 10-codes values", () => {
  expect(
    hasPermission(
      [
        Permissions.ViewUsers,
        Permissions.DeleteUsers,
        Permissions.ManageValueCodes10,
        Permissions.ManageValueDepartment,
        Permissions.ManageValueOfficerRank,
        Permissions.ManageValueDivision,
      ],
      [Permissions.ManageValueCodes10],
    ),
  ).toBe(true);
});

test("Should allow an officer to update their status", () => {
  expect(
    hasPermission(
      [Permissions.EmsFd, Permissions.Leo],
      [Permissions.EmsFd, Permissions.Leo, Permissions.Dispatch, Permissions.ManageUnits],
    ),
  ).toBe(true);
});

test("Should allow a user to ban/manage a user with 'allPermissions'", () => {
  expect(hasPermission(allPermissions, [Permissions.BanUsers, Permissions.ManageUsers])).toBe(true);
});

test("Should return 'false' if user has no permissions", () => {
  expect(hasPermission([], [Permissions.DeleteBusinesses, Permissions.ManageBusinesses])).toBe(
    false,
  );
});

test("Should correctly return the user permissions", () => {
  expect(getPermissions(manageUsers)).toBeTypeOf("object");
});

test("Should correctly return the user permissions with 'allPermissions'", () => {
  expect(getPermissions(allPermissions)).toBeTypeOf("object");
});

test("Should return correct defaultPermissions", () => {
  expect(defaultPermissions.defaultLeoPermissions).toBeTypeOf("object");
  expect(defaultPermissions.defaultEmsFdPermissions).toBeTypeOf("object");
  expect(defaultPermissions.defaultDispatchPermissions).toBeTypeOf("object");
  expect(defaultPermissions.defaultValuePermissions).toBeTypeOf("object");
  expect(defaultPermissions.defaultImportPermissions).toBeTypeOf("object");
  expect(defaultPermissions.defaultManagementPermissions).toBeTypeOf("object");
  expect(defaultPermissions.defaultImportPermissions).toBeTypeOf("object");
  expect(defaultPermissions.defaultTowPermissions).toBeTypeOf("object");
  expect(defaultPermissions.defaultTaxiPermissions).toBeTypeOf("object");
  expect(defaultPermissions.allDefaultAdminPermissions).toBeInstanceOf(Array);
});
