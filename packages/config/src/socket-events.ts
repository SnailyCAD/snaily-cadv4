export enum SocketEvents {
  CreateTowCall = "CreateTowCall",
  UpdateTowCall = "UpdateTowCall",
  EndTowCall = "EndTowCall",

  CreateTaxiCall = "CreateTaxiCall",
  UpdateTaxiCall = "UpdateTaxiCall",
  EndTaxiCall = "EndTaxiCall",

  Create911Call = "Create911Call",
  Update911Call = "Update911Call",
  End911Call = "End911Call",

  CreateBolo = "CreateBolo",
  UpdateBolo = "UpdateBolo",
  DeleteBolo = "DeleteBolo",

  UpdateAreaOfPlay = "UpdateAreaOfPlay",
  UpdateOfficerStatus = "UpdateOfficerStatus",
  UpdateEmsFdStatus = "UpdateEmsFdStatus",
  UpdateDispatchersState = "UpdateDispatchersState",
  SetUnitOffDuty = "SetUnitOffDuty",
  UpdateUnitStatus = "UpdateUnitStatus",

  UserBanned = "UserBanned",
  UserDeleted = "UserDeleted",

  Signal100 = "Signal100",

  PANIC_BUTTON_ON = "PANIC_BUTTON_ON",
  PANIC_BUTTON_OFF = "PANIC_BUTTON_OFF",

  CreateActiveIncident = "CreateActiveIncident",
  UpdateActiveIncident = "UpdateActiveIncident",

  CreateActiveWarrant = "CreateActiveWarrant",
  UpdateActiveWarrant = "UpdateActiveWarrant",

  RoleplayStopped = "RoleplayStopped",
  Tones = "Tones",
}
