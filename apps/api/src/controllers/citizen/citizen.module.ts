import { Module } from "@nestjs/common";
import { CitizenController } from "./CitizenController";
import { LicensesController } from "./LicenseController";
import { MedicalRecordsController } from "./MedicalRecordController";
import { PetsController } from "./pets-controller";
import { TruckLogsController } from "./truck-logs-controller";
import { VehiclesController } from "./vehicles-controller";
import { WeaponController } from "./weapon-controller";

@Module({
  controllers: [
    CitizenController,
    LicensesController,
    MedicalRecordsController,
    PetsController,
    TruckLogsController,
    VehiclesController,
    WeaponController,
  ],
})
export class CitizenModule {
  name = "CitizenModule";
}
