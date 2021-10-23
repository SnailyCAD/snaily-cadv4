export enum SocketEvents {
  CreateTowCall = "CREATE_TOW_CALL",
  UpdateTowCall = "UPDATE_TOW_CALL",
  EndTowCall = "END_TOW_CALL",

  CreateTaxiCall = "CREATE_TAXI_CALL",
  UpdateTaxiCall = "UPDATE_TAXI_CALL",
  EndTaxiCall = "END_TAXI_CALL",

  Create911Call = "CREATE_911_CALL",
  Update911Call = "UPDATE_911_CALL",
  End911Call = "END_911_CALL",

  CreateBolo = "CREATE_BOLO",
  UpdateBolo = "UPDATE_BOLO",
  DeleteBolo = "DELETE_BOLO",

  UpdateAreaOfPlay = "UPDATE_AREA_OF_PLAY",

  UpdateOfficerStatus = "UPDATE_OFFICER_STATUS",
  UpdateEmsFdStatus = "UPDATE_EMS_FD_STATUS",

  UserBanned = "USER_BANNED",
}
