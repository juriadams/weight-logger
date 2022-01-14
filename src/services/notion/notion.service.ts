import { Injectable } from "@nestjs/common";

import { Client } from "@notionhq/client";
import {
    CreatePageResponse,
    SearchResponse,
    UpdateDatabaseResponse,
} from "@notionhq/client/build/src/api-endpoints";

import * as moment from "moment";
import { Signale } from "signale";

@Injectable()
export class NotionService {
    /**
     * Logger instance
     */
    private logger: Signale;

    /**
     * Notion client instance
     */
    private notion: Client;

    constructor() {
        // Create new Logger instance
        this.logger = new Signale({ scope: "NotionService" });

        if (!process.env.NOTION_API_KEY) {
            this.logger.fatal("`NOTION_API_KEY` environment variable missing");
            process.exit(1);
        }

        if (!process.env.NOTION_DATABASE) {
            this.logger.warn("`NOTION_DATABASE` environment variable missing");
        }

        // Create new Notion API instance
        this.notion = new Client({
            auth: process.env.NOTION_API_KEY,
        });
    }

    /**
     * Get all Databases we have access to
     * @returns Promise resolving the `SearchResponse`
     */
    public getDatabases = async (): Promise<SearchResponse> => {
        const log = this.logger.scope("getDatabases");
        log.await("fetching databases...");

        try {
            const result = await this.notion.search({
                filter: { value: "database", property: "object" },
            });

            log.success(`found ${result.results?.length} database(s)`);

            return result;
        } catch (error) {
            log.fatal("error fetching databases");
            log.fatal(error);
        }
    };

    /**
     * Update the specified database and add columns for the desired format
     * @param database `database_id` of the database to update
     * @param data Payload containing the `unit` to create new columns with
     * @returns Promise resolving the `UpdateDatabaseResponse`
     */
    public updateDatabase = async (
        database: string,
        data: { unit: "kg" | "lb" },
    ): Promise<UpdateDatabaseResponse> => {
        const log = this.logger.scope("updateDatabase");
        log.await("updating database...");

        try {
            const result = this.notion.databases.update({
                database_id: database,
                properties: {
                    Date: {
                        name: "Date",
                        title: {},
                    },
                    [`Weight (${data.unit})`]: {
                        number: {},
                    },
                    [`Fat Mass (${data.unit})`]: {
                        number: {},
                    },
                    "Fat Mass (%)": {
                        number: {},
                    },
                    [`Lean Mass (${data.unit})`]: {
                        number: {},
                    },
                },
            });

            log.success("updated database");

            return result;
        } catch (error) {
            log.fatal("error updating database");
            log.fatal(error);
        }
    };

    /**
     * Create a new database entry with the given weight data
     * @param database `database_id` of the database to update
     * @param data Payload containing the data to write
     * @returns Promise resolving the `CreatePageResponse`
     */
    public createEntry = async (
        database: string,
        data: {
            date: moment.Moment;
            unit: "kg" | "lb";
            weight: number;
            fatMass: number;
            fatMassPercent: number;
            leanMass: number;
        },
    ): Promise<CreatePageResponse> => {
        const log = this.logger.scope("createEntry");
        log.await("creating database entry...");

        try {
            const result = this.notion.pages.create({
                parent: { database_id: database },
                properties: {
                    Date: {
                        title: [
                            {
                                text: {
                                    content:
                                        data.date.format("DD-MM-YYYY HH:mm"),
                                },
                            },
                        ],
                    },
                    [`Weight (${data.unit})`]: {
                        number: data.weight,
                    },
                    [`Fat Mass (${data.unit})`]: {
                        number: data.fatMass,
                    },
                    "Fat Mass (%)": {
                        number: data.fatMassPercent,
                    },
                    [`Lean Mass (${data.unit})`]: {
                        number: data.leanMass,
                    },
                },
            });

            log.success("created database entry");

            return result;
        } catch (error) {
            log.fatal("error creating database entry");
            log.fatal(error);
        }
    };
}
