import type * as Prisma from "../prisma/index";
import type * as Types from "../index.js";

/** bleeter */
/**
 * @method Get
 * @route /bleeter
 */
export interface GetBleeterData {
  totalCount: number;
  posts: (Prisma.BleeterPost & {
    user: Pick<Types.User, "username">;
    creator: Types.BleeterProfile | null;
  })[];
  userBleeterProfile: Prisma.BleeterProfile | null;
}

/**
 * @method Get
 * @route /bleeter/:id
 */
export type GetBleeterByIdData = GetBleeterData["posts"][number];

/**
 * @method Post
 * @route /bleeter/:id
 */
export type PostBleeterData = GetBleeterByIdData;

/**
 * @method Put
 * @route /bleeter/:id
 */
export type PutBleeterByIdData = GetBleeterByIdData;

/**
 * @method Post
 * @route /bleeter/:id
 */
export type PostBleeterByIdImageData = Pick<Prisma.BleeterPost, "imageId">;

/**
 * @method Delete
 * @route /bleeter/:id
 */
export type DeleteBleeterByIdData = boolean;

/**
 * @method POST
 * @route /bleeter/new-experience/profile
 */
export type PostNewExperienceProfileData = Types.BleeterProfile;

/**
 * @method GET
 * @route /bleeter/profiles/:handle
 */
export type GetBleeterProfileByHandleData = Types.BleeterProfile & {
  postsCount: number;
  followersCount: number;
  followingCount: number;
  posts: Types.BleeterPost[];
  isFollowingThisProfile: boolean;
};

/**
 * @method GET
 * @route /bleeter/profiles/:handle/followers
 */
export type GetBleeterProfileFollowersData = (Types.BleeterProfileFollow & {
  followerProfile: Types.BleeterProfile | null;
})[];

/**
 * @method GET
 * @route /bleeter/profiles/:handle/following
 */
export type GetBleeterProfileFollowingData = (Types.BleeterProfileFollow & {
  followingProfile: Types.BleeterProfile | null;
})[];
