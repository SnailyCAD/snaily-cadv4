import { Module } from "@nestjs/common";
import { BleeterProfilesController } from "./bleeter-profile-controller";
import { BleeterController } from "./bleeter-controller";

@Module({
  controllers: [BleeterController, BleeterProfilesController],
})
export class BleeterModule {
  name = "BleeterModule";
}
