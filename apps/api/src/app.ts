import { Module } from "@nestjs/common";
import { NavController } from "./controllers/nav-controller";
import { MainController } from "./controllers/main-controller";
import { AuthModule } from "./controllers/auth/auth.module";
import { BleeterModule } from "./controllers/bleeter/bleeter.module";
import { CitizenModule } from "./controllers/citizen/citizen.module";
import { BusinessModule } from "./controllers/business/business.module";
import { RecordsController } from "./controllers/record/records-controller";

@Module({
  imports: [AuthModule, BleeterModule, CitizenModule, BusinessModule],
  controllers: [NavController, MainController, RecordsController],
})
export class AppModule {
  name = "AppModule";
}
