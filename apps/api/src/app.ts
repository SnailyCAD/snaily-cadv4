import { Module } from "@nestjs/common";
import { NavController } from "./controllers/nav-controller";
import { MainController } from "./controllers/main-controller";
import { AuthModule } from "./controllers/auth/auth.module";
import { BleeterModule } from "./controllers/bleeter/bleeter.module";
// import { ManageValuesModule } from "./controllers/admin/values/values.module";
import { CitizenModule } from "./controllers/citizen/citizen.module";
import { BusinessModule } from "./controllers/business/business.module";

@Module({
  imports: [AuthModule, BleeterModule, CitizenModule, BusinessModule],
  controllers: [NavController, MainController],
})
export class AppModule {
  name = "AppModule";
}
