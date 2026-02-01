const { ApplicationCommandOptionType, PermissionFlagsBits, MessageFlags, ContainerBuilder, TextDisplayBuilder, flatten } = require("discord.js");
const disabledCommandSchema = require("../../../models/localdisableModel.js");

module.exports = {
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

        const subCommand = interaction.options.getSubcommand();
        const parancs = interaction.options.getString("parancs");

        const locallyDisabled = await disabledCommandSchema.findOne({ Guild: interaction.guild.id });
        
        if (subCommand === "átállítás") {
            const name = parancs.toLowerCase().split(" ")[0];
            const command = client.commands.get(name);
            const filteredCmds = client.commands.filter(x => x.directory == "information" || x.directory == "configuration").map(x => x.name);

            if (!command) return interaction.reply({ content: "Nincs ilyen parancs!", flags: MessageFlags.Ephemeral });
            if (filteredCmds.includes(name)) return interaction.reply({ content: "Konfiguráció és Információ kategóriájú parancsok nem kikapcsolhatóak!", flags: MessageFlags.Ephemeral });
        
            if (command.name === name) {
                if (!locallyDisabled) {
                    const newData = new disabledCommandSchema({
                        Guild: interaction.guild.id,
                        Commands: [name]
                    });
                    await newData.save();

                    interaction.reply({ content: `\`${name}\` parancs kikapcsolva` });
                } else {
                    if (locallyDisabled.Commands.includes(name)) {
                        const index = locallyDisabled.Commands.indexOf(name);

                        if (index > -1) {
                            locallyDisabled.Commands.splice(index, 1);
                            await locallyDisabled.save();

                            if (locallyDisabled.Commands.length === 0) await disabledCommandSchema.deleteOne({ Guild: interaction.guild.id });
                            interaction.reply({ content: `\`${name}\` parancs bekapcsolva` });
                        }
                    } else {
                        locallyDisabled.Commands.push(name);
                        await locallyDisabled.save();

                        if (locallyDisabled.Commands.length === 0) await disabledCommandSchema.deleteOne({ Guild: interaction.guild.id });
                    }

                    interaction.reply({ content: `\`${name}\` parancs kikapcsolva` });
                }
            }
        }

        if (subCommand === "kikapcsoltak") {
            if (!locallyDisabled) return interaction.reply({ content: "Nincsenek a szerveren kikapcsolt parancsok!", flags: MessageFlags.Ephemeral });
            
            const toggleContainer = new ContainerBuilder()
            .addTextDisplayComponents(new TextDisplayBuilder().setContent(`### Kikapcsolt parancsok (${locallyDisabled.Commands.length}):`))
            .addTextDisplayComponents(new TextDisplayBuilder().setContent(`\`\`\`${locallyDisabled.Commands.join(", ").length > 1990 ? locallyDisabled.Commands.join(", ").substring(0, 1990) + "..." : locallyDisabled.Commands.join(", ")}\`\`\``));

            interaction.reply({ components: [toggleContainer], flags: MessageFlags.IsComponentsV2 });
        }
    }
}