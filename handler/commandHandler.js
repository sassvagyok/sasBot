import { glob } from "glob";
import path from "path";
import { pathToFileURL } from "url";
import customCommandSchema from "../models/customcommandModel.js";

const globPromise = glob;

export default async (client) => {

    // Eventek regisztrálása
    const eventFiles = await globPromise(`${process.cwd()}/events/*.js`);
    for (const value of eventFiles) await import(pathToFileURL(value).href);

    // Slash parancsok kezelése
    const slashCommands = await globPromise(`${process.cwd()}/commands/slash/**/*.js`);
    slashCommands.sort((a, b) => a.localeCompare(b));

    const arrayOfSlashCommands = [];
    for (const value of slashCommands) {
        const fileModule = await import(pathToFileURL(value).href);
        const file = fileModule.default;
        const splitted = value.split(path.sep);
        const directory = splitted[splitted.length - 2];

        if (!file?.name) continue;

        const properties = { directory, ...file };
        client.commands.set(file.name, properties);
        if (["Message", "User"].includes(file.type)) delete file.description;
        arrayOfSlashCommands.push(file);
    }

    // Context menu parancsok kezelése
    const contextMenuCommands = await globPromise(`${process.cwd()}/commands/context/*.js`);

    const arrayOfContextMenuCommands = [];
    for (const value of contextMenuCommands) {
        const fileModule = await import(pathToFileURL(value).href);
        const file = fileModule.default;
        if (!file?.name) continue;
        client.contextMenuCommands.set(file.name, file);

        if (["Message", "User"].includes(file.type)) delete file.description;
        arrayOfContextMenuCommands.push(file);
    }

    const allCommands = arrayOfSlashCommands.concat(arrayOfContextMenuCommands);

    client.on("ready", async () => {
        // Context & Slash beépített parancsok regisztrálása
        await client.application.commands.set(allCommands);

        // Slash egyedi parancsok regisztrálása
        customCommandSchema.find().then(data => {
            data.forEach((cmd) => {
                const guild = client.guilds.cache.get(cmd.Guild);
                guild?.commands.create({
                    name: cmd.Command,
                    description: "Egyedi parancs ezen a szerveren" 
                });
            });
        });
    });
}