import { ApplicationCommandOptionType, PermissionFlagsBits, MessageFlags, ContainerBuilder, TextDisplayBuilder } from "discord.js";
import customCommandSchema from "../../../models/customcommandModel.js";

export default {
    name: "customcommand",
    description: "Egyedi parancsok kezelése",
    info: "Egyedi parancsok hozzáadása (maximum 50), szerkesztése, törlése és megjelenítése.\n`Szükséges jogosultság: Adminisztrátor*`",
    dm_permission: false,
    options: [
        {
            name: "hozzáadás",
            description: "Egyedi parancs hozzáadása",
            type: ApplicationCommandOptionType.Subcommand,
            options: [
                {
                    name: "parancs",
                    description: "Új egyedi parancs neve",
                    type: ApplicationCommandOptionType.String,
                    required: true,
                    maxLength: 100
                },
                {
                    name: "válasz",
                    description: "Új egyedi parancs válasza",
                    type: ApplicationCommandOptionType.String,
                    required: true,
                    maxLength: 1500
                }
            ]
        },
        {
            name: "szerkesztés",
            description: "Egyedi parancs szerkesztése",
            type: ApplicationCommandOptionType.Subcommand,
            options: [
                {
                    name: "parancs",
                    description: "Egyedi parancs neve",
                    type: ApplicationCommandOptionType.String,
                    required: true,
                    maxLength: 100
                },
                {
                    name: "válasz",
                    description: "Egyedi parancs új válasza",
                    type: ApplicationCommandOptionType.String,
                    required: true,
                    maxLength: 1500
                }
            ]
        },
        {
            name: "törlés",
            description: "Egyedi parancs törlése",
            type: ApplicationCommandOptionType.Subcommand,
            options: [
                {
                    name: "parancs",
                    description: "Egyedi parancs neve",
                    type: ApplicationCommandOptionType.String,
                    required: true
                }
            ]
        },
        {
            name: "parancsok",
            description: "Egyedi parancsok megjelenítése",
            type: ApplicationCommandOptionType.Subcommand
        } 
    ],
    run: async (client, interaction) => {

        const subCommand = interaction.options.getSubcommand();
        const name = interaction.options.getString("parancs")?.toLowerCase().split(" ")[0];
        const response = interaction.options.getString("válasz");
        const command = client.commands.get(name);

        const customCommand = await customCommandSchema.findOne({ Guild: interaction.guild.id, Command: name });
        const customCommandData = await customCommandSchema.find({ Guild: interaction.guild.id });

        if (subCommand === "parancsok") {
            if (customCommandData.length < 0) return interaction.reply({ content: "Nincsenek egyedi parancsok a szerveren!", flags: MessageFlags.Ephemeral });

            const formattedCustomCommands = customCommandData.map((cmd) => cmd.Command.toString().charAt(0).toUpperCase() + cmd.Command.slice(1)).join(", ");
            
            const customcommandContainer = new ContainerBuilder()
            .addTextDisplayComponents(new TextDisplayBuilder().setContent(`### Egyedi parancsok (${customCommandData.length}):`))
            .addTextDisplayComponents(new TextDisplayBuilder().setContent(`\`\`\`${formattedCustomCommands.length > 1990 ? formattedCustomCommands.substring(0, 1990) + "..." : formattedCustomCommands}\`\`\``));

            interaction.reply({ components: [customcommandContainer], flags: MessageFlags.IsComponentsV2 });
        }

        if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) return interaction.reply({ content: "Hiányzó jogosultság: \`Adminisztrátor\`", flags: MessageFlags.Ephemeral });

        if (subCommand === "hozzáadás") {
            if (customCommandData.length >= 50) return interaction.reply({ content: "Maximum 50 egyedi parancsot adhatsz hozzá egy szerverhez!", flags: MessageFlags.Ephemeral });

            if (command) {
                if (command.name === name) return interaction.reply({ content: `\`${name}\` nevű parancs már létezik!`, flags: MessageFlags.Ephemeral });
            }
    
            if (customCommand) interaction.reply({ content: `\`${name}\` nevű egyedi parancs már létezik!`, flags: MessageFlags.Ephemeral });
            else {
                const newData = new customCommandSchema({
                    Guild: interaction.guild.id,
                    Command: name,
                    Response: response
                });
                await newData.save();

                interaction.guild.commands.create({ name: name, description: "Egyedi parancs ezen a szerveren" });
                return interaction.reply({ content: `\`${name}\` egyedi parancs hozzáadva` });
            }
        }

        if (subCommand === "szerkesztés") {
            if (command) {
                if (command.name === name) return interaction.reply({ content: `\`${name}\` nem egyedi parancs!`, flags: MessageFlags.Ephemeral });
            }

            if (!customCommand) return interaction.reply({ content: `\`${name}\` nevű egyedi parancs nem létezik!`, flags: MessageFlags.Ephemeral });
            await customCommandSchema.findOneAndUpdate({ Guild: interaction.guild.id, Command: name }, { Response: response });
            
            const slashCommand = await interaction.guild.commands.cache.find((cmd) => cmd.name === name);

            await interaction.guild.commands.delete(slashCommand.id);
            interaction.guild.commands.create({ name: name, description: "Egyedi parancs ezen a szerveren" });

            return interaction.reply({ content: `\`${name}\` egyedi parancs frissítve` });
        }

        if (subCommand === "törlés") {
            if (!customCommand) return interaction.reply({ content: `\`${name}\` nevű egyedi parancs nem létezik!`, flags: MessageFlags.Ephemeral });
            await customCommandSchema.findOneAndDelete({ Guild: interaction.guild.id, Command: name });

            const slashCommand = await interaction.guild.commands.cache.find((cmd) => cmd.name == name);
            await interaction.guild.commands.delete(slashCommand.id);

            return interaction.reply({ content: `\`${name}\` egyedi parancs törölve` });
        }
    }
}