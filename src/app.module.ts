import { Module } from "@nestjs/common";
import { AppController } from "./app.controller";
import { NotionService } from "./services/notion/notion.service";

@Module({
    imports: [],
    controllers: [AppController],
    providers: [NotionService],
})
export class AppModule {}
