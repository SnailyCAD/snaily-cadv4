import { Controller, BodyParams, Post, Res, Response } from "@tsed/common";
import { hashSync, genSaltSync, compareSync } from "bcrypt";
import { BadRequest } from "@tsed/exceptions";
import { prisma } from "lib/prisma";
import { findOrCreateCAD, isFeatureEnabled } from "lib/cad";
import { REGISTER_SCHEMA, AUTH_SCHEMA } from "@snailycad/schemas";
import { validateSchema } from "lib/validateSchema";
import { ExtendedNotFound } from "src/exceptions/ExtendedNotFound";
import { ExtendedBadRequest } from "src/exceptions/ExtendedBadRequest";
import { validateUser2FA } from "lib/auth/2fa";
import { ContentType, Description, Returns } from "@tsed/schema";
import { User, WhitelistStatus, Rank, AutoSetUserProperties, cad, Feature } from "@prisma/client";
import { defaultPermissions, Permissions } from "@snailycad/permissions";
import { setUserPreferencesCookies } from "lib/auth/setUserPreferencesCookies";
import type * as APITypes from "@snailycad/types/api";
import { setUserTokenCookies } from "lib/auth/setUserTokenCookies";
import { validateGoogleCaptcha } from "lib/auth/validate-google-captcha";

@Controller("/auth")
@ContentType("application/json")
export class AuthController {
  @Post("/login")
  @Description("Authenticate a user via username and password")
  @Returns(200)
  @Returns(400, ExtendedBadRequest)
  @Returns(404, ExtendedNotFound)
  async login(
    @BodyParams() body: unknown,
    @Res() res: Response,
  ): Promise<APITypes.PostLoginUserData> {
    const data = validateSchema(AUTH_SCHEMA, body);

    const user = await prisma.user.findFirst({
      where: {
        username: { mode: "insensitive", equals: data.username },
      },
    });

    if (!user) {
      throw new ExtendedNotFound({ username: "userNotFound" });
    }

    const nonDiscordUserUsernameRegex = /^([a-z_.\d]+)*[a-z\d]+$/i;
    if (!user.discordId && !nonDiscordUserUsernameRegex.test(user.username)) {
      throw new ExtendedBadRequest({ username: "Invalid" });
    }

    if (user.whitelistStatus === WhitelistStatus.PENDING) {
      throw new ExtendedBadRequest({ username: "whitelistPending" });
    }

    if (user.whitelistStatus === WhitelistStatus.DECLINED) {
      throw new ExtendedBadRequest({ username: "whitelistDeclined" });
    }

    if (user.banned) {
      throw new ExtendedBadRequest({ username: "userBanned" });
    }

    // only allow Discord auth (if enabled)
    const cad = await prisma.cad.findFirst({ include: { features: true } });
    const regularAuthEnabled = isFeatureEnabled({
      features: cad?.features,
      feature: Feature.ALLOW_REGULAR_LOGIN,
      defaultReturn: true,
    });

    // allow owners to login by username/password, a little backup function.
    if (!regularAuthEnabled && user.rank !== Rank.OWNER) {
      throw new BadRequest("allowRegularLoginIsDisabled");
    }

    const userPassword = user.tempPassword ?? user.password;
    const isPasswordCorrect = compareSync(data.password, userPassword);
    if (!isPasswordCorrect) {
      throw new ExtendedBadRequest({ password: "passwordIncorrect" });
    }

    await validateUser2FA({
      totpCode: data.totpCode ?? null,
      userId: user.id,
      throwOnNotEnabled: false,
    });

    await setUserTokenCookies({ user, res });
    setUserPreferencesCookies({
      isDarkTheme: user.isDarkTheme,
      locale: user.locale ?? null,
      res,
    });

    if (user.tempPassword) {
      return { hasTempPassword: true };
    }

    return { userId: user.id };
  }

  @Post("/register")
  @Description("Create a user via username and password")
  @Returns(200)
  @Returns(400, ExtendedBadRequest)
  async register(
    @BodyParams() body: unknown,
    @Res() res: Response,
  ): Promise<APITypes.PostRegisterUserData> {
    const data = validateSchema(REGISTER_SCHEMA, body);

    await validateGoogleCaptcha(data);

    const hasDiscordOrSteamId = Boolean(data.discordId) || Boolean(data.steamId);

    // todo: custom function
    if (!data.password) {
      if (!hasDiscordOrSteamId) {
        throw new ExtendedBadRequest({
          password: "Required",
          error: "Must specify `discordId` or `steamId` when no password is present.",
        });
      }

      const _OR = [];
      if (data.discordId) {
        _OR.push({ discordId: data.discordId });
      }

      if (data.steamId) {
        _OR.push({ steamId: data.steamId });
      }

      const user = await prisma.user.findFirst({
        where: { OR: _OR },
      });

      if (user) {
        throw new ExtendedBadRequest({ username: "userAlreadyExistsWithDiscordOrSteamId" });
      }
    }

    const nonDiscordUserUsernameRegex = /^([a-z_.\d]+)*[a-z\d]+$/i;
    if (!nonDiscordUserUsernameRegex.test(data.username)) {
      throw new ExtendedBadRequest({ username: "Invalid" });
    }

    const existing = await prisma.user.findFirst({
      where: {
        username: { equals: data.username, mode: "insensitive" },
      },
    });

    if (existing) {
      throw new ExtendedBadRequest({ username: "userAlreadyExists" });
    }

    const preCad = await prisma.cad.findFirst({
      select: { features: true, registrationCode: true },
    });

    if (preCad?.registrationCode) {
      const code = data.registrationCode;
      if (code !== preCad.registrationCode) {
        throw new ExtendedBadRequest({ registrationCode: "invalidRegistrationCode" });
      }
    }

    // only allow Discord auth
    const regularAuthEnabled = isFeatureEnabled({
      features: preCad?.features,
      feature: Feature.ALLOW_REGULAR_LOGIN,
      defaultReturn: true,
    });

    if (!regularAuthEnabled) {
      throw new BadRequest("allowRegularLoginIsDisabled");
    }

    const userCount = await prisma.user.count();
    const salt = genSaltSync();

    const password = data.password ? hashSync(data.password, salt) : undefined;

    const user = await prisma.user.create({
      data: {
        username: data.username,
        password: password ?? "",
        steamId: data.steamId ?? null,
        discordId: data.discordId ?? null,
      },
    });

    const cad = await findOrCreateCAD({
      ownerId: user.id,
    });

    const permissions = getDefaultPermissionsForNewUser(cad);

    const extraUserData: Partial<User> =
      userCount <= 0
        ? {
            rank: Rank.OWNER,
            isDispatch: true,
            isLeo: true,
            isEmsFd: true,
            isSupervisor: true,
            isTow: true,
            isTaxi: true,
            whitelistStatus: WhitelistStatus.ACCEPTED,
          }
        : {
            rank: Rank.USER,
            whitelistStatus: cad.whitelisted ? WhitelistStatus.PENDING : WhitelistStatus.ACCEPTED,
            permissions,
          };

    await prisma.user.update({
      where: { id: user.id },
      data: extraUserData,
    });

    if (extraUserData.rank === Rank.USER && cad.whitelisted) {
      throw new BadRequest("whitelistPending");
    }

    await setUserTokenCookies({ user, res });
    setUserPreferencesCookies({
      isDarkTheme: user.isDarkTheme,
      locale: user.locale ?? null,
      res,
    });

    return { userId: user.id, isOwner: extraUserData.rank === Rank.OWNER };
  }
}

export function getDefaultPermissionsForNewUser(
  cad: (cad & { autoSetUserProperties?: AutoSetUserProperties | null }) | null,
) {
  const permissions: Permissions[] = [Permissions.CreateBusinesses];

  if (!cad?.towWhitelisted) {
    permissions.push(Permissions.ViewTowCalls, Permissions.ManageTowCalls, Permissions.ViewTowLogs);
  }

  if (!cad?.taxiWhitelisted) {
    permissions.push(Permissions.ViewTaxiCalls, Permissions.ManageTaxiCalls);
  }

  if (cad?.autoSetUserProperties?.dispatch) {
    permissions.push(...defaultPermissions.defaultDispatchPermissions);
  }

  if (cad?.autoSetUserProperties?.emsFd) {
    permissions.push(...defaultPermissions.defaultEmsFdPermissions);
  }

  if (cad?.autoSetUserProperties?.leo) {
    permissions.push(...defaultPermissions.defaultLeoPermissions);
  }

  return permissions;
}
