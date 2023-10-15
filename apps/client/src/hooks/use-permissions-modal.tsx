import { defaultPermissions, Permissions } from "@snailycad/permissions";
import { useTranslations } from "use-intl";

const DEPRECATED_PERMISSIONS = [
  Permissions.ViewDLExams,
  Permissions.ManageDLExams,
  Permissions.ViewWeaponExams,
  Permissions.ManageWeaponExams,
];

const filteredAdminPermissions = defaultPermissions.allDefaultAdminPermissions.filter(
  (p) => !defaultPermissions.defaultCourthousePermissions.includes(p),
);

interface UsePermissionsModalOptions {
  isReadOnly?: boolean;
}

export function usePermissionsModal(options: UsePermissionsModalOptions) {
  const t = useTranslations("Permissions");

  const groups = [
    {
      name: t("admin"),
      permissions: filteredAdminPermissions,
    },
    {
      name: t("courthouseAdmin"),
      permissions: defaultPermissions.defaultCourthousePermissions,
    },
    {
      name: t("leo"),
      permissions: [
        ...defaultPermissions.defaultLeoPermissions,
        Permissions.SetUserDefinedCallsignOnOfficer,
        Permissions.PurgeLeoIncidents,
      ],
    },
    {
      name: t("dispatch"),
      permissions: [
        ...defaultPermissions.defaultDispatchPermissions,
        Permissions.ManageSmartSigns,
        Permissions.ManageSmartMotorwaySigns,
      ],
    },
    {
      name: t("emsFd"),
      permissions: [
        ...defaultPermissions.defaultEmsFdPermissions,
        Permissions.SetUserDefinedCallsignOnEmsFd,
        Permissions.PurgeEmsFdIncidents,
      ],
    },
    {
      name: t("citizenRelated"),
      permissions: [
        ...defaultPermissions.defaultTowPermissions,
        ...defaultPermissions.defaultTaxiPermissions,
      ],
    },
    {
      name: t("owner"),
      permissions: [
        Permissions.ManageCADSettings,
        Permissions.DeleteRegisteredVehicles,
        Permissions.DeleteRegisteredWeapons,
      ],
    },
  ];

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
