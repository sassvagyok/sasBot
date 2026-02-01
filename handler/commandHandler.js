const { glob } = require("glob");
const path = require("path");
const customCommandSchema = require("../models/customcommandModel.js");

const globPromise = glob;

module.exports = async (client) => {

    // Eventek regisztrálása
    const eventFiles = await globPromise(`${process.cwd()}/events/*.js`);
    eventFiles.map((value) => require(path.resolve(value)));

    // Slash parancsok kezelése
    const slashCommands = await globPromise(`${process.cwd()}/commands/slash/**/*.js`);
    slashCommands.sort((a, b) => a.localeCompare(b));

    const arrayOfSlashCommands = [];
    slashCommands.map((value) => {
        const file = require(path.resolve(value));
        const splitted = value.split(path.sep);
        const directory = splitted[splitted.length - 2];

        if (!file?.name) return;

        const properties = { directory, ...file };
        client.commands.set(file.name, properties);
        if (["Message", "User"].includes(file.type)) delete file.description;
        arrayOfSlashCommands.push(file);
    });

    // Context menu parancsok kezelése
    const contextMenuCommands = await globPromise(`${process.cwd()}/commands/context/*.js`);

    const arrayOfContextMenuCommands = [];
    contextMenuCommands.map((value) => {
        const file = require(path.resolve(value));
        if (!file?.name) return;
        client.contextMenuCommands.set(file.name, file);

        if (["Message", "User"].includes(file.type)) delete file.description;
        arrayOfContextMenuCommands.push(file);
    });

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