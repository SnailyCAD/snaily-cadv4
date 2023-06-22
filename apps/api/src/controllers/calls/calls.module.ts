import { Module } from "@nestjs/common";
import { TaxiController } from "./taxi-controller";
import { TowController } from "./tow-controller";

@Module({
  controllers: [TaxiController, TowController],
})
export class CallsModule {
  name = "CallsModule";
}
