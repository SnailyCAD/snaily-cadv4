import { Module } from "@nestjs/common";
import { ValuesController } from "./values-controller";

@Module({
  controllers: [ValuesController],
})
export class ManageValuesModule {
  name = "ManageValuesModule";
}
