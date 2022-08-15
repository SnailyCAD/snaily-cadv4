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
    hasPermission({
      userToCheck: { permissions: manageUsers, rank: "USER" },
      permissionsToCheck: [
        Permissions.ViewUsers,
        Permissions.ManageUsers,
        Permissions.BanUsers,
        Permissions.DeleteUsers,
      ],
    }),
  ).toBe(true);
});

test("Should NOT be allowed to manage/delete/ban a user", () => {
  expect(
    hasPermission({
      userToCheck: { permissions: manageUsers, rank: "USER" },
      permissionsToCheck: defaultPermissions.defaultTowPermissions,
    }),
  ).toBe(false);
});

test("Should not allow a user to manage/delete/ban a user", () => {
  expect(
    hasPermission({
      userToCheck: { permissions: [Permissions.ViewUsers], rank: "USER" },
      permissionsToCheck: [Permissions.ManageUsers, Permissions.BanUsers, Permissions.DeleteUsers],
    }),
  ).toBe(false);
});

test("Should not allow a user to delete a user", () => {
  expect(
    hasPermission({
      userToCheck: {
        permissions: [Permissions.ViewUsers, Permissions.ManageUsers],
        rank: "USER",
      },
      permissionsToCheck: [Permissions.DeleteUsers],
    }),
  ).toBe(false);
});

test("Should allow with rank OWNER is able to delete x with 'allPermissions'", () => {
  expect(
    hasPermission({
      userToCheck: { rank: "OWNER", permissions: [] },
      permissionsToCheck: [
        Permissions.DeleteUsers,
        Permissions.DeleteUnits,
        Permissions.DeleteBusinesses,
      ],
    }),
  ).toBe(true);
});

test("Should allow a user to manage name change requests (Navbar tests)", () => {
  expect(
    hasPermission({
      userToCheck: { permissions: allDefaultAdminPermissions, rank: "USER" },
      permissionsToCheck: [Permissions.ViewNameChangeRequests],
    }),
  ).toBe(true);
});

test("Should allow a user to manage 10-codes values", () => {
  expect(
    hasPermission({
      userToCheck: {
        rank: "USER",
        permissions: [
          Permissions.ViewUsers,
          Permissions.DeleteUsers,
          Permissions.ManageValueCodes10,
          Permissions.ManageValueDepartment,
          Permissions.ManageValueOfficerRank,
          Permissions.ManageValueDivision,
        ],
      },
      permissionsToCheck: [Permissions.ManageValueCodes10],
    }),
  ).toBe(true);
});

test("Should allow an officer to update their status", () => {
  expect(
    hasPermission({
      userToCheck: { permissions: [Permissions.EmsFd, Permissions.Leo], rank: "USER" },
      permissionsToCheck: [
        Permissions.EmsFd,
        Permissions.Leo,
        Permissions.Dispatch,
        Permissions.ManageUnits,
      ],
    }),
  ).toBe(true);
});

test("Should allow a user to ban/manage a user with rank OWNER", () => {
  expect(
    hasPermission({
      userToCheck: { permissions: [], rank: "OWNER" },
      permissionsToCheck: [Permissions.BanUsers, Permissions.ManageUsers],
    }),
  ).toBe(true);
});

test("Should return 'false' if user has no permissions (Rank: USER|ADMIN)", () => {
  expect(
    hasPermission({
      permissionsToCheck: [Permissions.DeleteBusinesses, Permissions.ManageBusinesses],
      userToCheck: { rank: "USER", permissions: [], roles: [] },
    }),
  ).toBe(false);
});

test("Should correctly return the user permissions", () => {
  expect(getPermissions({ permissions: manageUsers, rank: "USER" })).toBeTypeOf("object");
});

test("Should correctly return the user permissions with 'allPermissions'", () => {
  expect(getPermissions({ permissions: allPermissions, rank: "OWNER" })).toBeTypeOf("object");
});

test("Should return 'true' if user has roles", () => {
  expect(
    hasPermission({
      permissionsToCheck: [Permissions.EmsFd],
      userToCheck: {
        rank: "USER",
        permissions: [],
        roles: [
          {
            permissions: [Permissions.LiveMap, Permissions.EmsFd],
          },
        ],
      },
    }),
  ).toBe(true);
});

test("Should return 'false' if user has roles", () => {
  expect(
    hasPermission({
      permissionsToCheck: [Permissions.EmsFd],
      userToCheck: {
        rank: "USER",
        permissions: [Permissions.Leo],
        roles: [
          {
            permissions: [Permissions.Leo, Permissions.Dispatch],
          },
        ],
      },
    }),
  ).toBe(false);
});

test("Should return 'true' if user has roles", () => {
  expect(
    hasPermission({
      permissionsToCheck: [Permissions.Dispatch],
      userToCheck: {
        rank: "USER",
        permissions: [Permissions.Leo],
        roles: [
          {
            permissions: [Permissions.Leo, Permissions.Dispatch],
          },
        ],
      },
    }),
  ).toBe(true);
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
