import type * as Prisma from "@prisma/client";
import type * as Types from "../index.js";

/** calls */
/**
 * @method GET
 * @route /911-calls
 */
export interface Get911CallsData {
  calls: (Types.Call911 & {
    assignedUnits: Types.AssignedUnit[];
    events: Types.Call911Event[];
  })[];
  totalCount: number;
}

/**
 * @method GET
 * @route /911-calls/:id
 */
export type Get911CallByIdData = Get911CallsData["calls"][number];

/**
 * @method POST
 * @route /911-calls
 */
export type Post911CallsData = Get911CallsData["calls"][number];

/**
 * @method PUT
 * @route /911-calls/:id
 */
export type Put911CallByIdData = Get911CallsData["calls"][number];

/**
 * @method DELETE
 * @route /911-calls/purge
 */
export type DeletePurge911CallsData = boolean;

/**
 * @method DELETE
 * @route /911-calls/:id
 */
export type Delete911CallByIdData = boolean;

/**
 * @method POST
 * @route /911-calls/link-incident/:callId
 */
export type PostLink911CallToIncident =
  | (Prisma.Call911 & { incidents: Types.LeoIncident[] })
  | null;

/**
 * @method POST
 * @route /911-calls/:type/:callId
 */
export type Post911CallAssignUnAssign = Get911CallsData["calls"][number];

/**
 * @method PUT
 * @route /911-calls/:callId/assigned-units/:assignedUnitId
 */
export type PUT911CallAssignedUnit = Get911CallsData["calls"][number];

/**
 * @method POST
 * @route /911-calls/events
 */
export type Post911CallEventsData = Get911CallsData["calls"][number];

/**
 * @method PUT
 * @route /911-calls/events/:id
 */
export type Put911CallEventByIdData = Get911CallsData["calls"][number];

/**
 * @method DELETE
 * @route /911-calls/events/:id
 */
export type Delete911CallEventByIdData = Get911CallsData["calls"][number];

/** dispatch */
/**
 * @method GET
 * @route /dispatch
 */
export interface GetDispatchData {
  areaOfPlay: string | null;
  activeDispatchersCount: number;
  userActiveDispatcher:
    | (Prisma.ActiveDispatchers & {
        department?: Types.DepartmentValue | null;
        user: Pick<Types.User, "id" | "username">;
      })
    | null;
  activeIncidents: Types.LeoIncident[];
}

/**
 * @method POST
 * @route /dispatch/aop
 */
export type PostDispatchAopData = Pick<Types.cad, "areaOfPlay">;

/**
 * @method POST
 * @route /dispatch/signal-100
 */
export interface PostDispatchSignal100Data {
  value: boolean;
}

/**
 * @method POST
 * @route /dispatch/dispatchers-state
 */
export interface PostDispatchDispatchersStateData {
  activeDispatchersCount: number;
  dispatcher: (Prisma.ActiveDispatchers & { user: Pick<Types.User, "id" | "username"> }) | null;
}

/**
 * @method PUT
 * @route /dispatch/radio-channel
 */
export type PutDispatchRadioChannelData = Types.Officer | Types.EmsFdDeputy | Types.CombinedLeoUnit;

/**
 * @method GET
 * @route /dispatch/tones
 */
export type GETDispatchTonesData = Types.ActiveTone[];

/**
 * @method POST
 * @route /dispatch/tones
 */
export type PostDispatchTonesData = boolean;

/**
 * @method DELETE
 * @route /dispatch/tones/:id
 */
export type DeleteDispatchTonesData = boolean;

/**
 * @method PUT
 * @route /dispatch/status/:unitId
 */
export type PutDispatchStatusByUnitId = Types.Officer | Types.EmsFdDeputy | Types.CombinedLeoUnit;

/**
 * @method POST
 * @route /dispatch/status/merge/leo
 */
export type PostDispatchStatusMergeOfficers = Types.CombinedLeoUnit;

/**
 * @method POST
 * @route /dispatch/status/merge/ems-fd
 */
export type PostDispatchStatusMergeDeputies = Types.CombinedEmsFdUnit;

/**
 * @method POST
 * @route /dispatch/status/unmerge/:id
 */
export type PostDispatchStatusUnmergeUnitById = boolean;

/**
 * @method GET
 * @route /dispatch/players/:steamId
 */
export type GetDispatchPlayerBySteamIdData = Pick<
  Types.User,
  | "username"
  | "id"
  | "isEmsFd"
  | "isLeo"
  | "isDispatch"
  | "permissions"
  | "rank"
  | "steamId"
  | "discordId"
> & {
  unit: Types.Officer | Types.CombinedLeoUnit | Types.EmsFdDeputy | null;
};

export type PostDispatchUnitsSearchData = (
  | Types.Officer
  | Types.CombinedLeoUnit
  | Types.EmsFdDeputy
  | Types.CombinedEmsFdUnit
)[];
