import { Feature, cad, CadFeature, User } from "@prisma/client";
import { defaultPermissions, hasPermission } from "@snailycad/permissions";
import { isFeatureEnabled } from "lib/cad";

interface Options {
  user: User;
  cad: Partial<cad> & { features?: CadFeature[] };
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
    fallback: (user) => user.isLeo || user.isEmsFd,
  });

  if (isCommonCardsEnabled && hasLeoPermissions) return false;
  return true;
}
