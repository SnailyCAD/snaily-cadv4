import { Module } from "@nestjs/common";
import { BusinessController } from "./BusinessController";
import { BusinessEmployeeController } from "./EmployeeController";
import { BusinessPostsController } from "./PostsController";
import { BusinessRolesController } from "./business-roles-controller";

@Module({
  controllers: [
    BusinessController,
    BusinessEmployeeController,
    BusinessPostsController,
    BusinessRolesController,
  ],
})
export class BusinessModule {
  name = "BusinessModule";
}
