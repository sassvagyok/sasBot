import { PermissionFlagsBits, InteractionType, EmbedBuilder, PermissionsBitField, MessageFlags, ContainerBuilder, TextDisplayBuilder } from "discord.js";
import client from "../index.js";
import saspont from "./saspontCreate.js";
import globallyDisabled from "../data/disabledCommands.json" with { type: "json" };
import commandStatisticsSchema from "../models/commandStatisticsModel.js";
import customCommandSchema from "../models/customcommandModel.js";
import disabledCommandSchema from "../models/localdisableModel.js";
import djRoleSchema from "../models/djroleModel.js";
import musicChannelSchema from "../models/musicchannelModel.js";
import permissionSchema from "../models/permissionModel.js";
import modsettingSchema from "../models/modsettingModel.js";

// Hibakezelés
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

client.on("interactionCreate", async (interaction) => {

    // Parancs-statisztikák
    let commandStatisticsData = await commandStatisticsSchema.findOne();
    if (!commandStatisticsData) {
        const newStat = new commandStatisticsSchema({ Slash: [], Context: [] });

        await newStat.save();
        commandStatisticsData = await commandStatisticsSchema.findOne();
    }

    // Modsettings első regisztrálás
    let modsettingData;
    if (interaction.channel.type !== 1) {
        modsettingData = await modsettingSchema.findOne({ Guild: interaction.guild.id });

        if (!modsettingData) {
            const newData = new modsettingSchema({
                Guild: interaction.guild.id,
                DM: true,
                Log: true,
                Send: true
            });
            await newData.save();
        }
    }

    // Lokálisan kikapcsolt parancsok
    let locallyDisabled;
    if (interaction.channel.type !== 1) locallyDisabled = await disabledCommandSchema.findOne({ Guild: interaction.guild.id });

    // Globálisan kikapcsolt parancsok
    // Slash parancsok kezelése
    if (!interaction.isContextMenuCommand() && interaction.type == InteractionType.ApplicationCommand) {
        const cmd = client.commands.get(interaction.commandName);
        let customCommand, permissionData;

        if (interaction.channel.type !== 1) {
            customCommand = await customCommandSchema.findOne({ Guild: interaction.guild.id, Command: interaction.commandName });
            permissionData = await permissionSchema.findOne({ Guild: interaction.guild.id });
        }

        // Beépített parancsok esetén
        if (cmd) {
            const args = [];

            for (let option of interaction.options.data) {
                if (option.type === "SubCommand") {
                    if(option.name) args.push(option.name);
                    option.options?.forEach((x) => {
                        if(x.value) args.push(x.value);
                    });
                } else if (option.value) args.push(option.value);
            }

            interaction.member = interaction.guild ? interaction.guild.members.cache.get(interaction.user.id) : client.users.cache.find(user => user.id === interaction.user.id);

            // Kikapcsolt parancsok kezelése
            if (globallyDisabled && globallyDisabled.includes(cmd.name)) return interaction.reply({ content: "Ez a parancs jelenleg nem elérhető!", flags: MessageFlags.Ephemeral });
            if (locallyDisabled && locallyDisabled.Commands.includes(cmd.name)) return interaction.reply({ content: "Ez a parancs ki van kapcsolva ezen a szerveren!", flags: MessageFlags.Ephemeral });

            // Felhasználó permission kezelése
            if (permissionData) {
                const modifiedCmd = permissionData.Commands.find(c => c.Name == cmd.name);

                // Ha van egyedi permission
                if (modifiedCmd) {
                    const roles = interaction.member.roles.cache.filter((roles) => roles.id !== interaction.guild.id).map(x => x.id);
                    const hasRole = modifiedCmd.Roles.some(x => roles.includes(x));
                    if (!hasRole) {
                        const requiredRoles = [];
                        for (elem of modifiedCmd.Roles) {
                            const role = interaction.guild.roles.cache.find(r => r.id === elem);
                            requiredRoles.push(role);
                        }
                        
                        if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
                            return interaction.reply({ content: `Hiányzó rang: ${requiredRoles.join("/")}!`, flags: MessageFlags.Ephemeral, allowedMentions: {} });
                        }
                    }

                // Ha nincs egyedi permission
                } else if (cmd.permission) {
                    if (!interaction.member.permissions.has(cmd.permission) && !interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
                        let cmdPerms = new PermissionsBitField(cmd.permission).toArray();
                        return interaction.reply({ content: `Hiányzó jogosultság: \`${cmdPerms[0]}\`!`, flags: MessageFlags.Ephemeral });
                    }
                }
            }

            // Zenés parancsok kezelése
            if (cmd.directory === "music" && interaction.channel.type !== 1) {

                // Csatorna egyezés ellenőrzése
                if (cmd.vc_check) {
                    if (!interaction.member.voice.channel || !interaction.guild.members.me.voice.channel) return interaction.reply({ content: "Nem vagyunk ugyanabban a hangcsatornában!", flags: MessageFlags.Ephemeral });
                    if (interaction.member.voice.channel.id !== interaction.guild.members.me.voice.channel.id) return interaction.reply({ content: "Nem vagyunk ugyanabban a hangcsatornában!", flags: MessageFlags.Ephemeral });
                }
                
                // Zenecsatorna kezelése
                const musicChannelData = await musicChannelSchema.findOne({ Guild: interaction.guild.id });

                const channelExceptions = [
                    "lyrics"
                ];

                if (musicChannelData && musicChannelData.Channel !== interaction.channel.id && !channelExceptions.includes(cmd.name) && !interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
                    return interaction.reply({ content: `Ebben a csatornában nem használhatóak a zene parancsok!\nZenecsatorna: <#${musicChannelData.Channel}>`, flags: MessageFlags.Ephemeral });
                }
        
                // Djrole kezelése
                const djRoleData = await djRoleSchema.findOne({ Guild: interaction.guild.id });

                const djExceptions = [
                    "lyrics",
                    "most",
                    "queue"
                ];
                
                if (djRoleData && !interaction.member.roles.cache.has(djRoleData.Role) && !djExceptions.includes(cmd.name) && !interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
                    const rang = interaction.guild.roles.cache.get(djRoleData.Role);
                    return interaction.reply({ content: `A parancs használatához szükséged van DJ rangra (${rang.name})!`, flags: MessageFlags.Ephemeral });
                }
            }

            // Embed jogosultság ellenőrzése
            if (cmd.has_embed && interaction.channel.type !== 1) {
                if (!interaction.channel.permissionsFor(interaction.guild.members.me).has(PermissionFlagsBits.EmbedLinks)) return interaction.reply({ content: "A parancs működéséhez szükségem van `Embed Links` jogosultságra!", flags: MessageFlags.Ephemeral });
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
                // Saspont kezelés
                await saspont(interaction.user);

                // Parancs futtatása
                await cmd.run(client, interaction, args);
            } catch (error) {
                createError(interaction, error);
            }

        // Egyedi parancsok kezelése
        } else if (customCommand) {
            return interaction.reply({ content: customCommand.Response });
        } else return interaction.reply({ content: "Hiba történt!", flags: MessageFlags.Ephemeral });
    }
    
    // Feedback kezelése
    if (interaction.type == InteractionType.ModalSubmit) {
        if (interaction.customId === "fb") {
            await interaction.reply({ content: "Visszajelzés elküldve! Köszönöm!", flags: MessageFlags.Ephemeral });
            const tárgy = interaction.fields.getTextInputValue("type");
            const leírás = interaction.fields.getTextInputValue("desc");
        
            const guild = client.guilds.cache.get(process.env.devServerId);
            if (!guild) return;
            const channel = guild.channels.cache.get(process.env.feedbackChannelId);
            if (!channel) return;
        
            const feedbackEmbed = new EmbedBuilder()
            .setColor("#1D88EC")
            .setTitle(tárgy)
            .setDescription(leírás)
            .setFooter({ text: interaction.user.username, iconURL: interaction.user.displayAvatarURL() });

            channel.send({ embeds: [feedbackEmbed] });
        }
    }

    // Context menü kezelés
    if (interaction.isContextMenuCommand()) {
        const command = client.contextMenuCommands.get(interaction.commandName);
        if (globallyDisabled && globallyDisabled.includes(command.name)) return interaction.reply({ content: "Ez a parancs jelenleg nem elérhető!", flags: MessageFlags.Ephemeral });
        if (locallyDisabled && locallyDisabled.Commands.includes(command.name)) return interaction.reply({ content: "Ez a parancs ki van kapcsolva a szerveren!", flags: MessageFlags.Ephemeral });

        // Djrole, Zenecsatorna kezelése
        if (interaction.commandName === "Play") {
            const djRoleData = await djRoleSchema.findOne({ Guild: interaction.guild.id });
            const musicChannelData = await musicChannelSchema.findOne({ Guild: interaction.guild.id });

            if (musicChannelData && musicChannelData.Channel !== interaction.channel.id) return interaction.reply({ content: `Ebben a csatornában nem használhatóak a zene parancsok! (<#${musicChannelData.Channel}>)`, flags: MessageFlags.Ephemeral });
        
            if (djRoleData && !interaction.member.roles.cache.has(djRoleData.Role)) {
                const rang = interaction.guild.roles.cache.get(djRoleData.Role);
                return interaction.reply({ content: `A parancs használatához szükséged van DJ rangra (${rang.name})!`, flags: MessageFlags.Ephemeral });
            }
        }

        // Embed jog ellenőrzése
        if (command.has_embed) {
            if (!interaction.channel.permissionsFor(interaction.guild.members.me).has(PermissionFlagsBits.EmbedLinks)) return interaction.reply({ content: "A parancs működéséhez szükségem van `Embed Links` jogosultságra!", flags: MessageFlags.Ephemeral });
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
            // Saspont kezelés
            await saspont(interaction.user);

            // Context menü parancs futtatása
            if (command) await command.run(client, interaction);
        } catch (error) {
            createError(interaction, error);
        }
    }
});