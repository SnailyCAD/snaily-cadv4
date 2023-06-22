import { User, Feature, Prisma, WhitelistStatus } from "@prisma/client";
import { WEAPON_SCHEMA } from "@snailycad/schemas";
import { canManageInvariant } from "lib/auth/getSessionUser";
import { isFeatureEnabled } from "lib/upsert-cad";
import { shouldCheckCitizenUserId } from "lib/citizen/has-citizen-access";
import { prisma } from "lib/data/prisma";
import { validateSchema } from "lib/data/validate-schema";
import { AuthGuard } from "middlewares/auth/is-auth";
import { generateString } from "utils/generate-string";
import { citizenInclude } from "./CitizenController";
import type * as APITypes from "@snailycad/types/api";
import { ExtendedBadRequest } from "src/exceptions/extended-bad-request";
import type { Weapon } from "@snailycad/types";
import { IsFeatureEnabled } from "middlewares/is-enabled";
import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from "@nestjs/common";
import { SessionUser } from "~/decorators/user";
import { Cad } from "~/decorators/cad";
import { Description } from "~/decorators/description";

@Controller("/weapons")
@UseGuards(AuthGuard)
@IsFeatureEnabled({ feature: Feature.WEAPON_REGISTRATION })
export class WeaponController {
  private MAX_ITEMS_PER_TABLE_PAGE = 12;
  private SERIAL_NUMBER_LENGTH = 10;

  @Get("/:citizenId")
  async getCitizenWeapons(
    @Param("citizenId") citizenId: string,
    @SessionUser() user: User,
    @Cad() cad: { features?: Record<Feature, boolean> },
    @Query("skip") skip = "0",
    @Query("query") query?: string,
  ): Promise<APITypes.GetCitizenWeaponsData> {
    const checkCitizenUserId = shouldCheckCitizenUserId({ cad, user });
    const citizen = await prisma.citizen.findFirst({
      where: { id: citizenId, userId: checkCitizenUserId ? user.id : undefined },
    });

    if (!citizen) {
      throw new NotFoundException("citizenNotFound");
    }

    const where: Prisma.WeaponWhereInput = {
      ...{ citizenId },
      ...(query
        ? {
            OR: [
              { model: { value: { value: { contains: query, mode: "insensitive" } } } },
              { registrationStatus: { value: { contains: query, mode: "insensitive" } } },
              { serialNumber: { contains: query, mode: "insensitive" } },
            ],
          }
        : {}),
    };

    const [totalCount, weapons] = await prisma.$transaction([
      prisma.weapon.count({ where }),
      prisma.weapon.findMany({
        where,
        take: this.MAX_ITEMS_PER_TABLE_PAGE,
        skip: parseInt(skip),
        include: citizenInclude.weapons.include,
        orderBy: { createdAt: "desc" },
      }),
    ]);

    return { totalCount, weapons };
  }

  @Post("/")
  @Description("Register a new weapon")
  async registerWeapon(
    @SessionUser() user: User,
    @Cad() cad: { features?: Record<Feature, boolean> },
    @Body() body: unknown,
  ): Promise<APITypes.PostCitizenWeaponData> {
    const data = validateSchema(WEAPON_SCHEMA, body);

    const citizen = await prisma.citizen.findUnique({
      where: {
        id: data.citizenId,
      },
    });

    const checkCitizenUserId = shouldCheckCitizenUserId({ cad, user });
    if (checkCitizenUserId) {
      canManageInvariant(citizen?.userId, user, new NotFoundException("notFound"));
    } else if (!citizen) {
      throw new NotFoundException("NotFound");
    }

    const isCustomEnabled = isFeatureEnabled({
      features: cad.features,
      feature: Feature.CUSTOM_TEXTFIELD_VALUES,
      defaultReturn: false,
    });

    const isBOFEnabled = isFeatureEnabled({
      features: cad.features,
      feature: Feature.BUREAU_OF_FIREARMS,
      defaultReturn: false,
    });

    let modelId = data.model;

    if (isCustomEnabled) {
      const newModel = await prisma.weaponValue.create({
        data: {
          value: {
            create: {
              isDefault: false,
              type: "WEAPON",
              value: data.model,
            },
          },
        },
      });

      modelId = newModel.id;
    }

    const weaponModel = await prisma.weaponValue.findUnique({
      where: { id: modelId },
    });

    if (!weaponModel) {
      throw new ExtendedBadRequest({
        model: "Invalid weapon model. Please re-enter the weapon model.",
      });
    }

    const weapon = await prisma.weapon.create({
      data: {
        citizenId: citizen.id,
        registrationStatusId: data.registrationStatus as string,
        serialNumber: await this.generateOrValidateSerialNumber(data.serialNumber || null),
        userId: user.id || undefined,
        bofStatus: isBOFEnabled ? WhitelistStatus.PENDING : WhitelistStatus.ACCEPTED,
        modelId,
      },
      include: citizenInclude.weapons.include,
    });

    return weapon;
  }

  @Put("/:id")
  @Description("Update a registered weapon")
  async updateWeapon(
    @SessionUser() user: User,
    @Cad() cad: { features?: Record<Feature, boolean> },
    @Param("id") weaponId: string,
    @Body() body: unknown,
  ): Promise<APITypes.PutCitizenWeaponData> {
    const data = validateSchema(WEAPON_SCHEMA, body);

    const weapon = await prisma.weapon.findUnique({
      where: {
        id: weaponId,
      },
    });

    const checkCitizenUserId = shouldCheckCitizenUserId({ cad, user });
    if (checkCitizenUserId) {
      canManageInvariant(weapon?.userId, user, new NotFoundException("notFound"));
    } else if (!weapon) {
      throw new NotFoundException("NotFound");
    }

    const isCustomEnabled = isFeatureEnabled({
      features: cad.features,
      feature: Feature.CUSTOM_TEXTFIELD_VALUES,
      defaultReturn: false,
    });

    let modelId = data.model;

    if (isCustomEnabled) {
      const weaponModel = await prisma.weaponValue.findFirst({
        where: { value: { value: { equals: data.model, mode: "insensitive" } } },
      });

      const newModel = await prisma.weaponValue.upsert({
        where: { id: String(weaponModel?.id) },
        update: {},
        create: {
          value: {
            create: {
              isDefault: false,
              type: "WEAPON",
              value: data.model,
            },
          },
        },
      });

      modelId = newModel.id;
    }

    const isBOFEnabled = isFeatureEnabled({
      features: cad.features,
      feature: Feature.BUREAU_OF_FIREARMS,
      defaultReturn: false,
    });

    const bofStatus = isBOFEnabled
      ? data.reApplyForDmv && weapon.bofStatus === WhitelistStatus.DECLINED
        ? WhitelistStatus.PENDING
        : undefined // undefined = will not update the database entry
      : null;

    const updated = await prisma.weapon.update({
      where: {
        id: weapon.id,
      },
      data: {
        modelId,
        registrationStatusId: data.registrationStatus as string,
        serialNumber: data.serialNumber
          ? await this.generateOrValidateSerialNumber(data.serialNumber, weapon)
          : undefined,
        bofStatus,
      },
      include: citizenInclude.weapons.include,
    });

    return updated;
  }

  @Delete("/:id")
  @Description("Delete a registered weapon")
  async deleteWeapon(
    @SessionUser() user: User,
    @Cad() cad: { features?: Record<Feature, boolean> },
    @Param("id") weaponId: string,
  ): Promise<APITypes.DeleteCitizenWeaponData> {
    const weapon = await prisma.weapon.findUnique({
      where: {
        id: weaponId,
      },
    });

    const checkCitizenUserId = shouldCheckCitizenUserId({ cad, user });
    if (checkCitizenUserId) {
      canManageInvariant(weapon?.userId, user, new NotFoundException("notFound"));
    } else if (!weapon) {
      throw new NotFoundException("NotFound");
    }

    await prisma.weapon.delete({
      where: {
        id: weapon.id,
      },
    });

    return true;
  }

  private async generateOrValidateSerialNumber(
    _serialNumber?: string | null,
    weapon?: Pick<Weapon, "id">,
  ): Promise<string> {
    const serialNumber = _serialNumber ?? generateString(this.SERIAL_NUMBER_LENGTH);

    const existing = await prisma.weapon.findFirst({
      where: {
        serialNumber: { mode: "insensitive", equals: serialNumber },
        NOT: weapon ? { id: weapon.id } : undefined,
      },
    });

    if (!existing) {
      return serialNumber;
    }

    if (_serialNumber) {
      throw new ExtendedBadRequest({ serialNumber: "serialNumberInUse" });
    }

    return this.generateOrValidateSerialNumber(_serialNumber, weapon);
  }
}
