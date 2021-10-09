import { Controller } from "@tsed/di";
import { UseBeforeEach } from "@tsed/platform-middlewares";
import { Get } from "@tsed/schema";
import { prisma } from "../../../lib/prisma";
import { IsAuth, IsAdmin } from "../../../middlewares";

@UseBeforeEach(IsAuth, IsAdmin)
@Controller("/users")
export class ManageUsersController {
  @Get("/")
  async getUsers() {
    const users = await prisma.user.findMany();

    return users;
  }
}
