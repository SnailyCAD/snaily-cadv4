import { Module } from "@nestjs/common";
import { AuthController } from "./auth-controller";
import { UserController } from "./user/user-controller";
import { UserTwoFactorAuthenticationController } from "./2fa-controller";
import { SteamOAuthController } from "./steam-auth-controller";
import { DiscordOAuthController } from "./discord-auth-controller";

@Module({
  controllers: [
    AuthController,
    DiscordOAuthController,
    SteamOAuthController,
    UserTwoFactorAuthenticationController,
    UserController,
  ],
})
export class AuthModule {
  name = "AuthModule";
}
