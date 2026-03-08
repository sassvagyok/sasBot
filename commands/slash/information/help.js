import { EmbedBuilder, ButtonBuilder, ActionRowBuilder, StringSelectMenuBuilder, ApplicationCommandOptionType, MessageFlags, ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, SectionBuilder, ButtonStyle } from "discord.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import customCommandSchema from "../../../models/customcommandModel.js";
import disabledCommandSchema from "../../../models/localdisableModel.js";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default {
    name: "help",
    description: "Az összes parancs kijelzése vagy egy parancs részletes leírása",
    info: "Minden elérhető és egyedi parancs kijelzése, vagy egy parancs bővebb ismertetése.",
    has_embed: true,
    options: [
        {
            name: "összes",
            description: "Összes parancs és rövid leírásuk megjelenítése",
            type: ApplicationCommandOptionType.Subcommand
        },
        {
            name: "részletes",
            description: "Részletes leírás megjelenítése a megadott parancsról",
            type: ApplicationCommandOptionType.Subcommand,
            options: [
                {
                    name: "parancs",
                    description: "Parancs neve",
                    type: ApplicationCommandOptionType.String,
                    required: true
                },
            ]
        }
    ],
    run: async (client, interaction) => {
        
        const subCommand = interaction.options.getSubcommand();
        const command = interaction.options.getString("parancs")?.toLowerCase().split(" ")[0];
        let customCommandData, disabledCommandData, globallyDisabled;

        if (interaction.channel.type !== 1) {
            customCommandData = await customCommandSchema.find({ Guild: interaction.guild.id, Command: command });
            globallyDisabled = client.config.globallyDisabledCommands;
            disabledCommandData = await disabledCommandSchema.findOne({ Guild: interaction.guild.id });
        };

        const emojis = {
            miscellaneous: "🍥",
            moderation: "🔨",
            information: "🤖",
            music: "🎵",
            configuration: "⌨️"
        }

        const dirs = {
            miscellaneous: "Sokszínű",
            moderation: "Moderáció",
            information: "Információ",
            music: "Zenelejátszás",
            configuration: "Konfiguráció"
        }

        const builtInCommand = client.commands.get(command);

        if (subCommand === "részletes") {
            if (customCommandData && customCommandData?.length > 0) {
                const customCommand = customCommandData.map(cmd => cmd.Command).toString();
        
                const helpContainer = new ContainerBuilder()
                .setAccentColor(0x1d88ec)
                .addTextDisplayComponents(new TextDisplayBuilder().setContent(`## ${customCommand.toString().charAt(0).toUpperCase() + customCommand.slice(1)}\nEgyedi parancs`))
                .addSeparatorComponents(new SeparatorBuilder())
                .addTextDisplayComponents(new TextDisplayBuilder().setContent(`"${customCommandData.map(cmd => cmd.Response).toString().substring(0, 1000)}"`));

                return interaction.reply({ components: [helpContainer], flags: MessageFlags.IsComponentsV2 });
            } else if (builtInCommand) {
                const docsButton = new ButtonBuilder()
                .setStyle(ButtonStyle.Link)
                .setURL(`${client.config.docsURL}/commands/${builtInCommand.name}`)
                .setLabel("Dokumentáció");

                const headerSection = new SectionBuilder()
                .addTextDisplayComponents(new TextDisplayBuilder().setContent(`## ${command.charAt(0).toUpperCase() + command.slice(1)}\n${dirs[builtInCommand.directory]}`))
                .setButtonAccessory(docsButton);
        
                const helpContainer = new ContainerBuilder()
                .setAccentColor(0x1d88ec)
                .addSectionComponents(headerSection)
                .addSeparatorComponents(new SeparatorBuilder())
                .addTextDisplayComponents(new TextDisplayBuilder().setContent(builtInCommand.info));

                if (builtInCommand.options) {
                    const onlySubCommands = builtInCommand.options.filter(x => x.type === 1 || x.type === 2);
                    const notSubCommandsAsString = builtInCommand.options.filter(x => x.type !== 1 && x.type !== 2).map(x => x.required ? `**\`${x.name}\`**: ${x.description}` : `\`${x.name}\`: ${x.description}`).join(" ");
                    let subCommands = [];
                    const subCommandsWithGroups = [];

                    const constructString = (cmd) => {
                        for (let i = 0; i < cmd.length; i++) {
                            let params;
    
                            if (cmd[i].type === 1) {
                                if (cmd[i].options) {
                                    params = cmd[i].options.map(x => x.required ? `**\`${x.name}\`**: ${x.description}` : `\`${x.name}\`: ${x.description}`).join(" ");
                                }
    
                                subCommands.push(`**${cmd[i].name.charAt(0).toUpperCase() + cmd[i].name.slice(1)}**: ${cmd[i].description}${params ? `\n    - ${params}` : ""}`);
                            }
                            
                            if (cmd[i].type === 2) {
                                constructString(cmd[i].options);
                                subCommandsWithGroups.push(`**${cmd[i].name.charAt(0).toUpperCase() + cmd[i].name.slice(1)}**\n    - ${subCommands.join("\n   - ")}`);
                                subCommands = [];
                            }
                        }
                    }

                    constructString(onlySubCommands);
                    subCommands = subCommandsWithGroups.concat(subCommands);

                    if (subCommands.length > 0) {
                        helpContainer
                        .addSeparatorComponents(new SeparatorBuilder().setDivider(false))
                        .addTextDisplayComponents(new TextDisplayBuilder().setContent(`### Alparancsok\n- ${subCommands.join("\n- ")}`));
                    }

                    if (notSubCommandsAsString.length > 0) {
                        helpContainer
                        .addSeparatorComponents(new SeparatorBuilder().setDivider(false))
                        .addTextDisplayComponents(new TextDisplayBuilder().setContent(`### Paraméterek\n- ${notSubCommandsAsString}`));
                    }
                }

                if (builtInCommand.dm_permission === false || (disabledCommandData && disabledCommandData.Commands.includes(builtInCommand.name)) || (globallyDisabled && globallyDisabled.includes(builtInCommand.name))) {
                    helpContainer.addSeparatorComponents(new SeparatorBuilder().setDivider(false));
                }

                if (builtInCommand.dm_permission === false) {
                    helpContainer
                    .addTextDisplayComponents(new TextDisplayBuilder().setContent("-# 📵 Nem elérhető privát üzenetben!"));
                }

                if (disabledCommandData && disabledCommandData.Commands.includes(builtInCommand.name)) {
                    helpContainer
                    .addTextDisplayComponents(new TextDisplayBuilder().setContent("-# 🚫 Kikapcsolva ezen a szerveren!"));
                }

                if (globallyDisabled && globallyDisabled.includes(builtInCommand.name)) {
                    helpContainer
                    .addTextDisplayComponents(new TextDisplayBuilder().setContent("-# ❗ Jelenleg nem elérhető!"));
                }

                return interaction.reply({ components: [helpContainer], flags: MessageFlags.IsComponentsV2 });
            } else return interaction.reply({ content: "A megadott parancs nem található!", flags: MessageFlags.Ephemeral });
        }

        if (subCommand === "összes") {
            if (interaction.channel.type !== 1) customCommandData = await customCommandSchema.find({ Guild: interaction.guild.id });

            //const directories = [...new Set(client.commands.map(cmd => cmd.directory))];

            // Hogy egyedi sorrendben legyenek
            const directories = ["moderation", "music", "configuration", "miscellaneous", "information"];
    
            const formatString = (str) => `${str[0].toUpperCase()}${str.slice(1).toLowerCase()}`;
    
            const categories = directories.map((dir) => {
                const getCommands = client.commands.filter((cmd) => cmd.directory === dir).map(cmd => {
                    return {
                        name: disabledCommandData && disabledCommandData.Commands.includes(cmd.name) || globallyDisabled && globallyDisabled.includes(cmd.name) ? "**~~" + cmd.name.charAt(0).toUpperCase() + cmd.name.slice(1) + "~~**" : cmd.name.charAt(0).toUpperCase() + cmd.name.slice(1),
                        description: disabledCommandData && disabledCommandData.Commands.includes(cmd.name) || globallyDisabled && globallyDisabled.includes(cmd.name) ? "~~" + cmd.description + "~~" : cmd.description || "Nincs leírás"
                    }
                });
    
                return {
                    directory: formatString(dir),
                    commands: getCommands
                }
            });
    
            const helpEmbed = new EmbedBuilder()
            .setDescription("Válassz kategóriát!")
            .setColor("1D88EC");
    
            const row = new ActionRowBuilder().addComponents(
                new StringSelectMenuBuilder()
                .setCustomId("help-menu1")
                .setPlaceholder("Kategória választás")
                .addOptions(
                    categories.map((cmd) => {
                        return {
                            label: dirs[cmd.directory.toLowerCase()] || cmd.directory,
                            value: cmd.directory.toLowerCase(),
                            description: fs.readdirSync(path.join(__dirname, "../" + cmd.directory.toLowerCase())).filter(file => file.endsWith(".js")).length.toString() + " parancs",
                            emoji: emojis[cmd.directory.toLowerCase()] || null
                        }
                    })
                )
            );

            if (customCommandData?.length > 0) {
                row.components[0].addOptions(
                    {
                        label: "Egyedi parancsok",
                        value: "custom",
                        description: customCommandData.length + " parancs",
                        emoji: "💾" || null
                    }
                );
            }
    
            const initialMessage = await interaction.reply({
                embeds: [helpEmbed],
                components: [row]
            });
    
            const filter = (buttonInteraction) => {
                if (buttonInteraction.user.id === interaction.user.id) return true;
                else buttonInteraction.deferUpdate();
            }
    
            const collector = initialMessage.createMessageComponentCollector({
                filter,
                time: 120000,
            });
    
            collector.on("collect", async (ButtonInteraction) => {
                if (!ButtonInteraction.values) return collector.stop();
        
                if (ButtonInteraction.values === "custom") {
                    helpEmbed = new EmbedBuilder()
                    .setTitle("💾 Egyedi parancsok")

                    for (let i = 0; i < customCommandData?.length; i++) {
                        if (helpEmbed.data.fields?.length == 25) {
                            helpEmbed.setDescription("Összes egyedi parancs: </customcommand parancsok:1338161977587142777>")
                            break;
                        }
                        
                        helpEmbed.addFields(
                            {
                                name: `**${customCommandData[i].Command.charAt(0).toUpperCase() + customCommandData[i].Command.slice(1)}**`,
                                value: " ",
                                inline: true
                            }
                        );
                    }

                    await ButtonInteraction.update({ embeds: [helpEmbed] });
                } else {
                    const [directory] = ButtonInteraction.values;
                    const category = categories.find(x => x.directory.toLowerCase() == directory);
            
                    helpEmbed = new EmbedBuilder()
                    .setColor("1D88EC")
                    .setTitle(emojis[directory.toLowerCase()] + " " + dirs[directory.toLowerCase()])
                    .addFields(
                        category.commands.map((cmd) => {
                            return {
                                name: `**${cmd.name.charAt(0).toUpperCase() + cmd.name.slice(1)}**`,
                                value: `${cmd.description}`,
                                inline: true,
                            }
                        })
                    )
                    
                    await ButtonInteraction.update({ embeds: [helpEmbed] });
                }
            });
    
            collector.on("end", async () => {
                await interaction.editReply({
                    components: [
                        new ActionRowBuilder()
                        .addComponents(
                            new StringSelectMenuBuilder()
                            .setCustomId("cl")
                            .setPlaceholder("Kategória választás")
                            .setDisabled(true)
                            .addOptions(
                                {
                                    label: "ph",
                                    value: "ph",
                                    description: "ph"
                                },
                            )
                        )
                    ]
                });
            });
        }
    }
}