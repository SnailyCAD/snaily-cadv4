import { Module } from "@nestjs/common";
import { NavController } from "./controllers/nav-controller";
import { MainController } from "./controllers/main-controller";
import { CitizenController } from "./controllers/citizen/CitizenController";
import { AuthModule } from "./controllers/auth/auth.module";
import { BleeterModule } from "./controllers/bleeter/bleeter.module";

@Module({
  imports: [AuthModule, BleeterModule],
  controllers: [NavController, MainController, CitizenController],
})
export class AppModule {
  name = "AppModule";
}
