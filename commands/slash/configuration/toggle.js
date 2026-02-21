import { ApplicationCommandOptionType, PermissionFlagsBits, MessageFlags, ContainerBuilder, TextDisplayBuilder } from "discord.js";
import disabledCommandSchema from "../../../models/localdisableModel.js";

export default {
    name: "toggle",
    description: "Parancsok ki- és bekapcsolása",
    info: "sasBot parancsainak ki- és bekapcsolása (kivéve Konfigurációs és Információs parancsok), vagy kikapcsolt parancsok megjelenítése.\n`Szükséges jogosultság: Adminisztrátor`",
    dm_permission: false,
    permission: PermissionFlagsBits.Administrator,
    options: [
        {
            name: "átállítás",
            description: "sasBot parancsok ki- vagy bekapcsolása",
            type: ApplicationCommandOptionType.Subcommand,
            options: [
                {
                    name: "parancs",
                    description: "Parancs neve, amit ki- vagy be akarsz kapcsolni",
                    type: ApplicationCommandOptionType.String,
                    required: false,
                    maxLength: 100
                }
            ]
        },
        {
            name: "kikapcsoltak",
            description: "Kikapcsolt parancsok megjelenítése",
            type: ApplicationCommandOptionType.Subcommand
        }
    ],
    run: async (client, interaction) => {

        const disabledCommandData = await disabledCommandSchema.findOne({ Guild: interaction.guild.id });
        const subCommand = interaction.options.getSubcommand();
        const builtInCommandName = interaction.options.getString("parancs").toLowerCase().split(" ")[0];
        
        if (subCommand === "átállítás") {
            const builtInCommand = client.commands.get(builtInCommandName);
            const filteredCommands = client.commands.filter(x => x.directory === "information" || x.directory === "configuration").map(x => x.builtInCommandName);

            if (!builtInCommand) return interaction.reply({ content: "Nincs ilyen parancs!", flags: MessageFlags.Ephemeral });
            if (filteredCommands.includes(builtInCommandName)) return interaction.reply({ content: "Konfiguráció és Információ kategóriájú parancsok nem kikapcsolhatóak!", flags: MessageFlags.Ephemeral });
        
            if (builtInCommand.name === builtInCommandName) {
                if (!disabledCommandData) {
                    const newData = new disabledCommandSchema({
                        Guild: interaction.guild.id,
                        Commands: [builtInCommandName]
                    });
                    await newData.save();

                    interaction.reply({ content: `\`${builtInCommandName}\` parancs kikapcsolva` });
                } else {
                    if (disabledCommandData.Commands.includes(builtInCommandName)) {
                        const commandIndex = disabledCommandData.Commands.indexOf(builtInCommandName);

                        if (commandIndex > -1) {
                            disabledCommandData.Commands.splice(commandIndex, 1);
                            await disabledCommandData.save();

                            if (disabledCommandData.Commands.length === 0) await disabledCommandSchema.deleteOne({ Guild: interaction.guild.id });
                            interaction.reply({ content: `\`${builtInCommandName}\` parancs bekapcsolva` });
                        }
                    } else {
                        disabledCommandData.Commands.push(builtInCommandName);
                        await disabledCommandData.save();

                        if (disabledCommandData.Commands.length === 0) await disabledCommandSchema.deleteOne({ Guild: interaction.guild.id });
                    }

                    interaction.reply({ content: `\`${builtInCommandName}\` parancs kikapcsolva` });
                }
            }
        }

        if (subCommand === "kikapcsoltak") {
            if (!disabledCommandData) return interaction.reply({ content: "Nincsenek a szerveren kikapcsolt parancsok!", flags: MessageFlags.Ephemeral });
            
            const toggleContainer = new ContainerBuilder()
            .addTextDisplayComponents(new TextDisplayBuilder().setContent(`### Kikapcsolt parancsok (${disabledCommandData.Commands.length}):`))
            .addTextDisplayComponents(new TextDisplayBuilder().setContent(`\`\`\`${disabledCommandData.Commands.join(", ").length > 1990 ? disabledCommandData.Commands.join(", ").substring(0, 1990) + "..." : disabledCommandData.Commands.join(", ")}\`\`\``));

            interaction.reply({ components: [toggleContainer], flags: MessageFlags.IsComponentsV2 });
        }
    }
}