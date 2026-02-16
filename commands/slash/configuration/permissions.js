import { ApplicationCommandOptionType, PermissionFlagsBits, MessageFlags, ContainerBuilder, TextDisplayBuilder, ButtonBuilder, ActionRowBuilder, SeparatorBuilder } from "discord.js";
import permissionSchema from "../../../models/permissionModel.js";

export default {
    name: "permissions",
    description: "Parancsok használatának ranghoz kötése",
    info: "Parancsok egyedi ranghoz való kötése az alapértelmezett jogosultság helyett (max. 5 rang) (kivéve Konfigurációs és Információs parancsok).\n`Szükséges jogosultság: Adminisztrátor`",
    dm_permission: false,
    permission: PermissionFlagsBits.Administrator,
    options: [
        {
            name: "átállítás",
            description: "Parancs használatának ranghoz kötése, vagy beállított rang kivétele",
            type: ApplicationCommandOptionType.Subcommand,
            options: [
                {
                    name: "parancs",
                    description: "Parancs neve",
                    type: ApplicationCommandOptionType.String,
                    required: true,
                    maxLength: 100
                },
                {
                    name: "rang",
                    description: "Rang, ami szükséges legyen a parancs használatához, vagy ennek kivétele",
                    type: ApplicationCommandOptionType.Role,
                    required: true
                }
            ]
        },
        {
            name: "visszaállítás",
            description: "Ranghoz kötött parancs visszaállítása alaphelyzetbe",
            type: ApplicationCommandOptionType.Subcommand,
            options: [
                {
                    name: "parancs",
                    description: "Parancs neve",
                    type: ApplicationCommandOptionType.String,
                    required: true,
                    maxLength: 100
                }
            ]
        },
        {
            name: "módosított",
            description: "Ranghoz kötött parancsok megjelenítése",
            type: ApplicationCommandOptionType.Subcommand
        },
    ],
    run: async (client, interaction) => {

        const subCommand = interaction.options.getSubcommand();
        const name = interaction.options.getString("parancs")?.toLowerCase().split(" ")[0];
        const rang = interaction.options.getRole("rang");

        const permissionData  = await permissionSchema.findOne({ Guild: interaction.guild.id });

        if (subCommand === "átállítás") {
            const command = client.commands.get(name);
            const filteredCmds = client.commands.filter(x => x.directory == "information" || x.directory == "configuration").map(x => x.name);

            if (!command) return interaction.reply({ content: "Nincs ilyen parancs!", flags: MessageFlags.Ephemeral });
            if (filteredCmds.includes(name)) return interaction.reply({ content: "Konfiguráció és Információ kategóriájú parancsokat nem köthetsz ranghoz!", flags: MessageFlags.Ephemeral });

            if (!permissionData) {
                const newData = new permissionSchema({
                    Guild: interaction.guild.id,
                    Commands: [
                        {
                            Name: name,
                            Roles: [rang.id]
                        }
                    ]
                });
                await newData.save();

                interaction.reply({ content: `\`${name}\` mostantól \`${rang.name}\` ranggal használható` });
            } else {
                const cmdIndex = permissionData.Commands.findIndex(x => {
                    return x.Name === name;
                });
                if (cmdIndex > -1) {
                    if (permissionData.Commands[cmdIndex].Roles.includes(rang.id)) {
                        const roleIndex = permissionData.Commands[cmdIndex].Roles.indexOf(rang.id);

                        permissionData.Commands[cmdIndex].Roles.splice(roleIndex, 1);
                        await permissionData.save();

                        interaction.reply({ content: `\`${name}\` mostantól használható \`${rang.name}\` rang nélkül is` });

                        if (permissionData.Commands[cmdIndex].Roles.length == 0) {
                            permissionData.Commands.splice(cmdIndex, 1);
                            await permissionData.save();
                        }

                        if (permissionData.Commands.length === 0) await permissionSchema.deleteOne({ Guild: interaction.guild.id });
                    } else {
                        if (permissionData.Commands[cmdIndex].Roles.length === 5) return interaction.reply({ content: "Egy parancshoz csak 5 rangot köthetsz!", flags: MessageFlags.Ephemeral });

                        permissionData.Commands[cmdIndex].Roles.push(rang.id);
                        await permissionData.save();

                        return interaction.reply({ content: `\`${name}\` mostantól \`${rang.name}\` ranggal is használható` });
                    }
                } else {
                    permissionData.Commands.push({ Name: name, Roles: [rang.id] });
                    await permissionData.save();

                    interaction.reply({ content: `\`${name}\` mostantól \`${rang.name}\` ranggal használható` });
                }
            }
        }

        if (subCommand === "visszaállítás") {
            if (!permissionData) interaction.reply({ content: `\`${name}\` már az alap jogosultságokkal használható!`, flags: MessageFlags.Ephemeral });
            else {
                const cmdIndex = permissionData.Commands.findIndex(x => {
                    return x.Name === name;
                });

                if (cmdIndex > -1) {
                    permissionData.Commands.splice(cmdIndex, 1);
                    await permissionData.save();

                    interaction.reply({ content: `\`${name}\` mostantól az alap jogosultságokkal használható!` });

                    if (permissionData.Commands.length === 0) await permissionSchema.deleteOne({ Guild: interaction.guild.id });
                } else interaction.reply({ content: `\`${name}\` már az alap jogosultságokkal használható!`, flags: MessageFlags.Ephemeral });
            }
        }

        if (subCommand === "módosított") {
            if (permissionData) {
                const modified = permissionData.Commands.map(x => `- \`${x.Name}\`: ${x.Roles.map(y => interaction.guild.roles.cache.find(r => r.id === y)).join(", ")}`).sort((a, b) => a.localeCompare(b, 'hu', { sensitivity: 'base' }));

                const permissionsContainer = new ContainerBuilder()
                .addTextDisplayComponents(new TextDisplayBuilder().setContent(`### Ranghoz kötött parancsok (${modified.length}):`))
                .addSeparatorComponents(new SeparatorBuilder);

                if (modified.length <= 15) {
                    permissionsContainer.addTextDisplayComponents(new TextDisplayBuilder().setContent(modified.join("\n").substring(0, 1994)));

                    interaction.reply({ components: [permissionsContainer], flags: MessageFlags.IsComponentsV2, allowedMentions: {} });
                } else {
                    const prevButton = new ButtonBuilder()
                    .setStyle("Primary")
                    .setCustomId("prev")
                    .setLabel("⬅️")
                    .setDisabled(true);
    
                    const nextButton = new ButtonBuilder()
                    .setStyle("Primary")
                    .setCustomId("next")
                    .setLabel("➡️");
    
                    const row = new ActionRowBuilder().addComponents(prevButton, nextButton);
    
                    let currentPage = 1;
                    let chunkSize = 15;
                    let allPages = Math.ceil(modified.length / chunkSize);
                    let startIndex = 0;

                    const pageSlice = () => modified.slice(startIndex, startIndex + chunkSize);

                    permissionsContainer.spliceComponents(0, 1, new TextDisplayBuilder().setContent(`### [${currentPage}/${allPages}] Ranghoz kötött parancsok (${modified.length}):`))
                    .addTextDisplayComponents(new TextDisplayBuilder().setContent(pageSlice().join("\n")))
                    .addSeparatorComponents(new SeparatorBuilder().setDivider(false).setSpacing(1))
                    .addActionRowComponents(row);

                    const msg = await interaction.reply({ components: [permissionsContainer], flags: MessageFlags.IsComponentsV2, allowedMentions: {} });
                    
                    const filter = (buttonInteraction) => {
                        if (buttonInteraction.user.id === interaction.member.id) return true;
                        else buttonInteraction.deferUpdate();
                    }
        
                    const collector = msg.createMessageComponentCollector({
                        filter,
                        time: 300000
                    });

                    collector.on("collect", async (collected) => {
                        const id = collected.customId;
    
                        if (id === "prev") {
                            if (currentPage > 1) {
                                currentPage--;
                                startIndex -= chunkSize;
                                row.components[1].setDisabled(false);

                                if (currentPage === 1) row.components[0].setDisabled(true);
                            } else await collected.deferUpdate();
                        }
    
                        if (id === "next") {
                            if (currentPage < allPages) {
                                currentPage++;
                                startIndex += chunkSize;
                                row.components[0].setDisabled(false);

                                if (currentPage === allPages) row.components[1].setDisabled(true);
                            } else await collected.deferUpdate();
                        }
    
                        permissionsContainer
                        .spliceComponents(0, 1, new TextDisplayBuilder().setContent(`### [${currentPage}/${allPages}] Ranghoz kötött parancsok (${modified.length}):`))
                        .spliceComponents(2, 1, new TextDisplayBuilder().setContent(pageSlice().join("\n")));

                        await collected.update({ components: [permissionsContainer], allowedMentions: {} });
                    });
    
                    collector.on("end", async () => {
                        row.components[0].setDisabled(true);
                        row.components[1].setDisabled(true);
    
                        await interaction.editReply({ components: [permissionsContainer], allowedMentions: {} });
                    });
                }
            } else interaction.reply({ content: "Nincsenek ranghoz kötött parancsok!", flags: MessageFlags.Ephemeral });
        }
    }
}