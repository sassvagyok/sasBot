import { PermissionFlagsBits, InteractionType, PermissionsBitField, MessageFlags, ContainerBuilder, TextDisplayBuilder, SeparatorBuilder } from "discord.js";
import saspontCreate from "../../utils/saspontCreate.js";
import commandStatisticsSchema from "../../models/commandStatisticsModel.js";
import customCommandSchema from "../../models/customcommandModel.js";
import disabledCommandSchema from "../../models/localdisableModel.js";
import djRoleSchema from "../../models/djroleModel.js";
import musicChannelSchema from "../../models/musicchannelModel.js";
import permissionSchema from "../../models/permissionModel.js";
import modsettingSchema from "../../models/modsettingModel.js";

export default {
    name: "interactionCreate",
    run: async (client, interaction) => {

        const createError = async (i, e) => {
            console.error(e);

            const errorContainerPublic = new ContainerBuilder()
            .setAccentColor(0xe2162e)
            .addTextDisplayComponents(new TextDisplayBuilder().setContent(`### Hiba történt!\n-# ID: ${i.id}`));

            if (i.deferred || i.replied) return i.channel.send({ components: [errorContainerPublic], flags: MessageFlags.IsComponentsV2 });
            else await i.reply({ components: [errorContainerPublic], flags: MessageFlags.IsComponentsV2 });

            const errorContainerPrivate = new ContainerBuilder()
            .setAccentColor(0xe2162e)
            .addTextDisplayComponents(new TextDisplayBuilder().setContent(`### ID: ${i.id}\n\`\`\`${e.stack.length > 1900 ? `${e.stack.slice(0, 1900)}...` : e.stack}\`\`\``));

            const guild = client.guilds.cache.get(process.env.devServerId);
            if (!guild) return;
            const channel = guild.channels.cache.get(process.env.errorChannelId);
            if (!channel) return;

            channel.send({ components: [errorContainerPrivate], flags: MessageFlags.IsComponentsV2 });
        }

        const createCommandStatistics = async () => {
            let commandStatisticsData = await commandStatisticsSchema.findOne();

            if (!commandStatisticsData) {
                const newStat = new commandStatisticsSchema({ Slash: [], Context: [] });

                await newStat.save();
                commandStatisticsData = await commandStatisticsSchema.findOne();
            }

            return commandStatisticsData;
        }

        const handleSlashCommands = async (i, locallyDisabled, commandStatisticsData) => {
            const cmd = client.commands.get(i.commandName);
            let customCommand, permissionData;

            if (i.channel.type !== 1) {
                customCommand = await customCommandSchema.findOne({ Guild: i.guild.id, Command: i.commandName });
                permissionData = await permissionSchema.findOne({ Guild: i.guild.id });
            }

            // Beépített parancsok esetén
            if (cmd) {
                const args = [];

                for (let option of i.options.data) {
                    if (option.type === "SubCommand") {
                        if(option.name) args.push(option.name);
                        option.options?.forEach((x) => {
                            if(x.value) args.push(x.value);
                        });
                    } else if (option.value) args.push(option.value);
                }

                i.member = i.guild ? i.guild.members.cache.get(i.user.id) : client.users.cache.find(user => user.id === i.user.id);

                // Globálisan és lokálisan kikapcsolt parancsok kezelése
                const globallyDisabled = client.config.globallyDisabledCommands;
                if (globallyDisabled && globallyDisabled.includes(cmd.name)) return i.reply({ content: "Ez a parancs jelenleg nem elérhető!", flags: MessageFlags.Ephemeral });
                if (locallyDisabled && locallyDisabled.Commands.includes(cmd.name)) return i.reply({ content: "Ez a parancs nem elérhető ezen a szerveren!", flags: MessageFlags.Ephemeral });

                // Felhasználó permission kezelése
                if (permissionData) {
                    const modifiedCmd = permissionData.Commands.find(c => c.Name == cmd.name);

                    // Ha van egyedi permission
                    if (modifiedCmd) {
                        const roles = i.member.roles.cache.filter((roles) => roles.id !== i.guild.id).map(x => x.id);
                        const hasRole = modifiedCmd.Roles.some(x => roles.includes(x));
                        if (!hasRole) {
                            const requiredRoles = [];
                            for (let elem of modifiedCmd.Roles) {
                                const role = i.guild.roles.cache.find(r => r.id === elem);
                                requiredRoles.push(role);
                            }
                            
                            if (!i.member.permissions.has(PermissionFlagsBits.Administrator)) {
                                return i.reply({ content: `Hiányzó rang: ${requiredRoles.join("/")}!`, flags: MessageFlags.Ephemeral, allowedMentions: {} });
                            }
                        }

                    // Ha nincs egyedi permission
                    } else if (cmd.permission) {
                        if (!i.member.permissions.has(cmd.permission) && !i.member.permissions.has(PermissionFlagsBits.Administrator)) {
                            let cmdPerms = new PermissionsBitField(cmd.permission).toArray();
                            return i.reply({ content: `Hiányzó jogosultság: \`${cmdPerms[0]}\`!`, flags: MessageFlags.Ephemeral });
                        }
                    }
                }

                // Zenés parancsok kezelése
                if (cmd.directory === "music" && i.channel.type !== 1) {

                    // Csatorna egyezés ellenőrzése
                    if (cmd.vc_check) {
                        if (!i.member.voice.channel || !i.guild.members.me.voice.channel) return i.reply({ content: "Nem vagyunk ugyanabban a hangcsatornában!", flags: MessageFlags.Ephemeral });
                        if (i.member.voice.channel.id !== i.guild.members.me.voice.channel.id) return i.reply({ content: "Nem vagyunk ugyanabban a hangcsatornában!", flags: MessageFlags.Ephemeral });
                    }
                    
                    // Zenecsatorna kezelése
                    const musicChannelData = await musicChannelSchema.findOne({ Guild: i.guild.id });

                    const channelExceptions = [
                        "lyrics"
                    ];

                    if (musicChannelData && musicChannelData.Channel !== i.channel.id && !channelExceptions.includes(cmd.name) && !i.member.permissions.has(PermissionFlagsBits.Administrator)) {
                        return i.reply({ content: `Ebben a csatornában nem használhatóak a zene parancsok!\nZenecsatorna: <#${musicChannelData.Channel}>`, flags: MessageFlags.Ephemeral });
                    }
            
                    // Djrole kezelése
                    const djRoleData = await djRoleSchema.findOne({ Guild: i.guild.id });

                    const djExceptions = [
                        "lyrics",
                        "most",
                        "queue"
                    ];
                    
                    if (djRoleData && !i.member.roles.cache.has(djRoleData.Role) && !djExceptions.includes(cmd.name) && !i.member.permissions.has(PermissionFlagsBits.Administrator)) {
                        const rang = i.guild.roles.cache.get(djRoleData.Role);
                        return i.reply({ content: `A parancs használatához szükséged van DJ rangra (${rang.name})!`, flags: MessageFlags.Ephemeral });
                    }
                }

                // Embed jogosultság ellenőrzése
                if (cmd.has_embed && i.channel.type !== 1) {
                    if (!i.channel.permissionsFor(i.guild.members.me).has(PermissionFlagsBits.EmbedLinks)) return i.reply({ content: "A parancs működéséhez szükségem van `Embed Links` jogosultságra!", flags: MessageFlags.Ephemeral });
                }

                // Parancs-használati statisztika rögzítése
                const cmdIndex = commandStatisticsData.Slash.findIndex(x => {
                    return x.Name === cmd.name;
                });

                if (cmdIndex > -1) {
                    commandStatisticsData.Slash[cmdIndex].Uses += 1;
                    await commandStatisticsData.save();
                } else {
                    commandStatisticsData.Slash.push({ Name: cmd.name, Uses: 1 });
                    await commandStatisticsData.save();
                }

                try {
                    await saspontCreate(i.user);

                    await cmd.run(client, i, args);
                } catch (error) {
                    createError(i, error);
                }

            // Egyedi parancsok kezelése
            } else if (customCommand) {
                return i.reply({ content: customCommand.Response });
            } else return i.reply({ content: "Hiba történt!", flags: MessageFlags.Ephemeral });
        }

        const handleContextCommands = async (i, locallyDisabled, commandStatisticsData) => {
            const command = client.contextMenuCommands.get(i.commandName);

            // Globálisan és lokálisan kikapcsolt parancsok kezelése
            const globallyDisabled = client.config.globallyDisabledCommands;
            if (globallyDisabled && globallyDisabled.includes(command.name)) return i.reply({ content: "Ez a parancs jelenleg nem elérhető!", flags: MessageFlags.Ephemeral });
            if (locallyDisabled && locallyDisabled.Commands.includes(command.name)) return i.reply({ content: "Ez a parancs nem elérhető ezen a szerveren!", flags: MessageFlags.Ephemeral });

            // Djrole, Zenecsatorna kezelése
            if (i.commandName === "Play") {
                const djRoleData = await djRoleSchema.findOne({ Guild: i.guild.id });
                const musicChannelData = await musicChannelSchema.findOne({ Guild: i.guild.id });

                if (musicChannelData && musicChannelData.Channel !== i.channel.id) return i.reply({ content: `Ebben a csatornában nem használhatóak a zene parancsok! (<#${musicChannelData.Channel}>)`, flags: MessageFlags.Ephemeral });
            
                if (djRoleData && !i.member.roles.cache.has(djRoleData.Role)) {
                    const rang = i.guild.roles.cache.get(djRoleData.Role);
                    return i.reply({ content: `A parancs használatához szükséged van DJ rangra (${rang.name})!`, flags: MessageFlags.Ephemeral });
                }
            }

            // Embed jog ellenőrzése
            if (command.has_embed) {
                if (!i.channel.permissionsFor(i.guild.members.me).has(PermissionFlagsBits.EmbedLinks)) return i.reply({ content: "A parancs működéséhez szükségem van `Embed Links` jogosultságra!", flags: MessageFlags.Ephemeral });
            }

            // Parancs-használati statisztika rögzítése
            const cmdIndex = commandStatisticsData.Context.findIndex(x => {
                return x.Name === command.name;
            });

            if (cmdIndex > -1) {
                commandStatisticsData.Context[cmdIndex].Uses += 1;
                await commandStatisticsData.save();
            } else {
                commandStatisticsData.Context.push({ Name: command.name, Uses: 1 });
                await commandStatisticsData.save();
            }

            try {
                await saspontCreate(i.user);

                if (command) await command.run(client, i);
            } catch (error) {
                createError(i, error);
            }
        }

        const handleFeedback = async (i) => {
            if (i.customId === "fb") {
                await i.reply({ content: "Visszajelzés elküldve!", flags: MessageFlags.Ephemeral });
                const feedBackType = i.fields.getStringSelectValues("type")
                const feedbackTitle = i.fields.getTextInputValue("subject");
                const feedbackContent = i.fields.getTextInputValue("body");
            
                const guild = client.guilds.cache.get(process.env.devServerId);
                if (!guild) return;
                const channel = guild.channels.cache.get(process.env.feedbackChannelId);
                if (!channel) return;

                const feedbackContainer = new ContainerBuilder()
                .setAccentColor(0x1d88ec)
                .addTextDisplayComponents(new TextDisplayBuilder().setContent(`### Visszajelzés: \`${i.user.username}\``))
                .addSeparatorComponents(new SeparatorBuilder())
                .addTextDisplayComponents(new TextDisplayBuilder().setContent(`**Típus**\n${feedBackType}\n**Tárgy**\n${feedbackTitle}\n**Leírás**\n${feedbackContent}`));

                channel.send({ components: [feedbackContainer], flags: MessageFlags.IsComponentsV2 });
            }
        }

        const registerModSettings = async (i) => {
            let modsettingData;
            if (i.channel.type !== 1) {
                modsettingData = await modsettingSchema.findOne({ Guild: i.guild.id });

                if (!modsettingData) {
                    const newData = new modsettingSchema({
                        Guild: i.guild.id,
                        DM: true,
                        Log: true,
                        Send: true
                    });
                    await newData.save();
                }
            }
        }

        const findLocallyDisabled = async (i) => {
            let locallyDisabled;
            if (i.channel.type !== 1) locallyDisabled = await disabledCommandSchema.findOne({ Guild: i.guild.id });

            return locallyDisabled;
        }

        // Modsettings első regisztrálás
        await registerModSettings(interaction);

        // Lokálisan kikapcsolt parancsok keresése
        const locallyDisabled = await findLocallyDisabled(interaction);

        // Parancs statisztikák
        const commandStatisticsData = await createCommandStatistics();

        // Slash parancsok kezelése
        if (!interaction.isContextMenuCommand() && interaction.type == InteractionType.ApplicationCommand) {
            await handleSlashCommands(interaction, locallyDisabled, commandStatisticsData);
        }
        
        // Feedback kezelése
        if (interaction.type === InteractionType.ModalSubmit) {
            await handleFeedback(i);
        }

        // Context menü kezelése
        if (interaction.isContextMenuCommand()) {
            await handleContextCommands(i, locallyDisabled, commandStatisticsData);
        }
    }
};