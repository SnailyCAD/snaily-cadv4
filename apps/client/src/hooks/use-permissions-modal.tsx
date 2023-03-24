import { defaultPermissions, Permissions } from "@snailycad/permissions";

const DEPRECATED_PERMISSIONS = [
  Permissions.ViewDLExams,
  Permissions.ManageDLExams,
  Permissions.ViewWeaponExams,
  Permissions.ManageWeaponExams,
];

const filteredAdminPermissions = defaultPermissions.allDefaultAdminPermissions.filter(
  (p) => !defaultPermissions.defaultCourthousePermissions.includes(p),
);

const groups = [
  {
    name: "Admin",
    permissions: filteredAdminPermissions,
  },
  {
    name: "Courthouse (Admin)",
    permissions: defaultPermissions.defaultCourthousePermissions,
  },
  {
    name: "LEO",
    permissions: defaultPermissions.defaultLeoPermissions,
  },
  {
    name: "Dispatch",
    permissions: defaultPermissions.defaultDispatchPermissions,
  },
  {
    name: "EMS/FD",
    permissions: defaultPermissions.defaultEmsFdPermissions,
  },
  {
    name: "Citizen related",
    permissions: [
      ...defaultPermissions.defaultTowPermissions,
      ...defaultPermissions.defaultTaxiPermissions,
    ],
  },
  {
    name: "Other",
    permissions: defaultPermissions.otherDefaultPermissions,
  },
  {
    name: "Owner",
    permissions: [Permissions.ManageCADSettings],
  },
];

interface UsePermissionsModalOptions {
  isReadOnly?: boolean;
}

export function usePermissionsModal(options: UsePermissionsModalOptions) {
  function handleToggleAll(
    group: (typeof groups)[number],
    values: Record<Permissions, boolean>,
    setValues: any,
  ) {
    if (options.isReadOnly) return;

    const groupPermissionValues = Object.entries(values).filter(([permission]) => {
      return group.permissions.includes(permission as Permissions);
    });
    const areAllChecked = groupPermissionValues.every(([, b]) => b);

    if (areAllChecked) {
      const obj = groupPermissionValues.reduce(
        (ac, [permission]) => ({ ...ac, [permission]: false }),
        {},
      );

      setValues({ ...values, ...obj });
    } else {
      const obj = group.permissions.reduce(
        (ac, cv) => ({
          ...ac,
          [cv]: true,
        }),
        {},
      );

      setValues({ ...values, ...obj });
    }
  }

  return { handleToggleAll, groups, DEPRECATED_PERMISSIONS };
}
