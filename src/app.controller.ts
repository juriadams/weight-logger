import { Body, Controller, Get, Post } from "@nestjs/common";
import { NotionService } from "./services/notion/notion.service";

import * as moment from "moment";

@Controller()
export class AppController {
    constructor(private notion: NotionService) {}

    @Get("/")
    public heartbeat(): { alive: boolean } {
        return { alive: true };
    }

    /**
     * Create a new notion database entry with the provided weight data
     * @param data Payload containing data to add to database (TODO: Validation)
     * @returns Promise resolving the page data
     */
    @Post("/create")
    public async create(
        @Body()
        data: {
            date: string;
            unit: "kg" | "lb";
            weight: number;
            fatMass: number;
            fatMassPercent: number;
            leanMass: number;
        },
    ): Promise<any> {
        // Either use `NOTION_DATABASE` environment variable or select the first available database
        let database: string;
        if (process.env.NOTION_DATABASE) {
            database = process.env.NOTION_DATABASE;
        } else {
            const databases = await this.notion.getDatabases();
            database = databases.results[0]?.id;
        }

        // Update the database to the right format
        await this.notion.updateDatabase(database, { unit: data.unit });

        // Create a new database entry
        return this.notion.createEntry(database, {
            ...data,
            date: moment(data.date, "MMMM DD, YYYY at HH:mmA"),
        });
    }
}
