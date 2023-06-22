import { Module } from "@nestjs/common";
import { NavController } from "./controllers/nav-controller";
import { MainController } from "./controllers/main-controller";
import { AuthController } from "./controllers/auth/auth-controller";
import { UserController } from "./controllers/auth/user/user-controller";
import { CitizenController } from "./controllers/citizen/CitizenController";

@Module({
  imports: [],
  controllers: [NavController, MainController, AuthController, UserController, CitizenController],
})
export class AppModule {}
