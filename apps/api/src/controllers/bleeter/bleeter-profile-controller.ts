import { Controller, Get, UseBeforeEach, PathParams, Post, Context } from "@tsed/common";
import { BadRequest, NotFound } from "@tsed/exceptions";
import { ContentType, Description } from "@tsed/schema";
import { prisma } from "lib/data/prisma";
import { IsAuth } from "middlewares/auth/is-auth";
import type { User } from "@prisma/client";
import type * as APITypes from "@snailycad/types/api";
import { Feature, IsFeatureEnabled } from "middlewares/is-enabled";

@UseBeforeEach(IsAuth)
@Controller("/bleeter/profiles")
@ContentType("application/json")
@IsFeatureEnabled({ feature: Feature.BLEETER })
export class BleeterController {
  @Get("/:handle")
  @Description("Get a bleeter profile by its handle")
  async getBleeterProfileByHandle(
    @PathParams("handle") handle: string,
  ): Promise<APITypes.GetBleeterProfileByHandleData> {
    const profile = await prisma.bleeterProfile.findUnique({
      where: { handle: handle.toLowerCase() },
      include: { posts: true },
    });

    if (!profile) {
      throw new NotFound("profileNotFound");
    }

    const [postsCount, followingCount, followersCount] = await prisma.$transaction([
      prisma.bleeterPost.count({ where: { creatorId: profile.id } }),
      prisma.bleeterProfileFollow.count({ where: { followingProfileId: profile.id } }),
      prisma.bleeterProfileFollow.count({ where: { followerProfileId: profile.id } }),
    ]);

    return { ...profile, postsCount, followersCount, followingCount };
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

    const follow = await prisma.bleeterProfileFollow.findFirst({
      where: {
        followerProfileId: profileToFollow.id,
        followingProfileId: userProfile.id,
      },
    });

    if (follow) {
      throw new BadRequest("alreadyFollowingProfile");
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
}
