import { Feature, type User } from "@prisma/client";
import { defaultPermissions, hasPermission } from "@snailycad/permissions";
import { isFeatureEnabled } from "lib/upsert-cad";

interface Options {
  user: User;
  cad: { features?: Record<Feature, boolean> };
}

export function shouldCheckCitizenUserId({ cad, user }: Options) {
  const isCommonCardsEnabled = isFeatureEnabled({
    defaultReturn: false,
    feature: Feature.COMMON_CITIZEN_CARDS,
    features: cad.features,
  });

  const hasLeoPermissions = hasPermission({
    userToCheck: user,
    permissionsToCheck: [
      ...defaultPermissions.defaultLeoPermissions,
      ...defaultPermissions.defaultEmsFdPermissions,
    ],
  });

  if (isCommonCardsEnabled && hasLeoPermissions) return false;
  return true;
}
