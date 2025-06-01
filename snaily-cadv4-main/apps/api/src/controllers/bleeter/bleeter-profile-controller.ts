import { Controller, Get, UseBeforeEach, PathParams, Post, Context } from "@tsed/common";
import { BadRequest, NotFound } from "@tsed/exceptions";
import { ContentType, Description } from "@tsed/schema";
import { prisma } from "lib/data/prisma";
import { IsAuth } from "middlewares/auth/is-auth";
import { User } from "@prisma/client";
import type * as APITypes from "@snailycad/types/api";
import { Feature, IsFeatureEnabled } from "middlewares/is-enabled";
import { UsePermissions } from "middlewares/use-permissions";
import { defaultPermissions } from "@snailycad/permissions";

@UseBeforeEach(IsAuth)
@Controller("/bleeter/profiles")
@ContentType("application/json")
@IsFeatureEnabled({ feature: Feature.BLEETER })
export class BleeterController {
  @Get("/:handle")
  @Description("Get a bleeter profile by its handle")
  async getBleeterProfileByHandle(
    @PathParams("handle") handle: string,
    @Context("user") user: User,
  ): Promise<APITypes.GetBleeterProfileByHandleData> {
    const profile = await prisma.bleeterProfile.findUnique({
      where: { handle: handle.toLowerCase() },
      include: { posts: true },
    });

    const userProfile = await prisma.bleeterProfile.findUnique({
      where: { userId: user.id },
    });

    if (!profile || !userProfile) {
      throw new NotFound("profileNotFound");
    }

    const [postsCount, followingCount, followersCount] = await prisma.$transaction([
      prisma.bleeterPost.count({ where: { creatorId: profile.id } }),
      prisma.bleeterProfileFollow.count({ where: { followingProfileId: profile.id } }),
      prisma.bleeterProfileFollow.count({ where: { followerProfileId: profile.id } }),
    ]);

    const isFollowingThisProfile = await prisma.bleeterProfileFollow.findFirst({
      where: {
        followerProfileId: profile.id,
        followingProfileId: userProfile.id,
      },
    });

    return {
      ...profile,
      postsCount,
      followersCount,
      followingCount,
      isFollowingThisProfile: Boolean(isFollowingThisProfile),
    };
  }

  @Get("/:handle/followers")
  @Description("Get a bleeter profile's followers")
  async getBleeterProfileFollowers(
    @PathParams("handle") handle: string,
  ): Promise<APITypes.GetBleeterProfileFollowersData> {
    const followers = await prisma.bleeterProfileFollow.findMany({
      where: { followerProfile: { handle: handle.toLowerCase() } },
      include: { followerProfile: true, followingProfile: true },
    });

    return followers;
  }

  @Get("/:handle/following")
  @Description("Get a bleeter profile's following")
  async getBleeterProfileFollowing(
    @PathParams("handle") handle: string,
  ): Promise<APITypes.GetBleeterProfileFollowingData> {
    const following = await prisma.bleeterProfileFollow.findMany({
      where: { followingProfile: { handle: handle.toLowerCase() } },
      include: { followerProfile: true, followingProfile: true },
    });

    return following;
  }

  @Post("/:handle/follow")
  @Description("Follow a bleeter profile")
  async followBleeterProfile(
    @PathParams("handle") handle: string,
    @Context("user") user: User,
  ): Promise<boolean> {
    const profileToFollow = await prisma.bleeterProfile.findUnique({
      where: { handle: handle.toLowerCase() },
    });

    const userProfile = await prisma.bleeterProfile.findUnique({
      where: { userId: user.id },
    });

    if (!profileToFollow || !userProfile) {
      throw new NotFound("profileNotFound");
    }

    if (profileToFollow.handle === userProfile.handle) {
      throw new BadRequest("cannotFollowSelf");
    }

    const isAlreadyFollowingThisProfile = await prisma.bleeterProfileFollow.findFirst({
      where: {
        followerProfileId: profileToFollow.id,
        followingProfileId: userProfile.id,
      },
    });

    if (isAlreadyFollowingThisProfile) {
      // unfollow this profile
      await prisma.bleeterProfileFollow.delete({
        where: { id: isAlreadyFollowingThisProfile.id },
      });

      return true;
    }

    await prisma.bleeterProfileFollow.create({
      data: {
        followerProfileId: profileToFollow.id,
        followingProfileId: userProfile.id,
        userId: user.id,
      },
    });

    return true;
  }

  @Post("/:handle/verify")
  @Description("Verify a bleeter profile")
  @UsePermissions({
    permissions: defaultPermissions.defaultManagementPermissions,
  })
  async verifyBleeterProfile(@PathParams("handle") handle: string): Promise<boolean> {
    const profileToVerify = await prisma.bleeterProfile.findUnique({
      where: { handle: handle.toLowerCase() },
    });

    if (!profileToVerify) {
      throw new NotFound("profileNotFound");
    }

    await prisma.bleeterProfile.update({
      where: { id: profileToVerify.id },
      data: { isVerified: !profileToVerify.isVerified },
    });

    return true;
  }
}
