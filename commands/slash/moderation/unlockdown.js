import { ApplicationCommandOptionType, PermissionFlagsBits, ChannelType, MessageFlags, ContainerBuilder, TextDisplayBuilder, SeparatorBuilder } from "discord.js";
import logChannelSchema from "../../../models/logchannelModel.js";
import modsettingSchema from "../../../models/modsettingModel.js";
import moment from "moment";
import "moment-timezone";

export default {
    name: "unlockdown",
    description: "Csatornák megnyitása",
    info: "Jelenlegi vagy megadott csatorna megnyitása.\n`Szükséges jogosultság: Csatornák kezelése`",
    dm_permission: false,
    permission: PermissionFlagsBits.ManageChannels,
    options: [
        {
            name: "csatorna",
            description: "Csatorna, amit meg akarsz nyitni (üres: jelenlegi csatorna)",
            type: ApplicationCommandOptionType.Channel,
            channelTypes: [ChannelType.GuildText],
            required: false
        }
    ],
    run: async (client, interaction) => {

        if (!interaction.guild.members.me.permissions.has(PermissionFlagsBits.ManageRoles) && interaction.channel.permissionsFor(interaction.guild.members.me).has(PermissionFlagsBits.ManageRoles)) return interaction.reply({ content: "Nincs jogom ehhez: \`Manage Roles\`!", flags: MessageFlags.Ephemeral });

        const userAuthor = interaction.member;
        const textChannel = interaction.options.getChannel("csatorna") || interaction.channel;
        
        if (!textChannel.permissionsFor(interaction.member).has(PermissionFlagsBits.SendMessages)) return interaction.reply({ content: "Nincs hozzáférésed ehhez a csatornához!", flags: MessageFlags.Ephemeral });
        if (!textChannel.permissionsFor(interaction.guild.members.me).has(PermissionFlagsBits.ViewChannel)) return interaction.reply({ content: "Nincs hozzáférésem a megadott csatornához!", flags: MessageFlags.Ephemeral });
        if (!textChannel.permissionsFor(interaction.guild.members.me).has(PermissionFlagsBits.ManageRoles)) return interaction.reply({ content: "Nincs jogom ehhez: \`Manage Roles\`!", flags: MessageFlags.Ephemeral });
        if (textChannel.permissionsFor(textChannel.guild.roles.everyone).has(PermissionFlagsBits.SendMessages) && textChannel.permissionsFor(textChannel.guild.roles.everyone).has(PermissionFlagsBits.SendMessagesInThreads)) return interaction.reply({ content: "A csatorna nincs lezárva!", flags: MessageFlags.Ephemeral });

        textChannel.permissionOverwrites.delete(interaction.channel.guild.roles.everyone, `Unlockdown - ${userAuthor.user.username}`);
    
        const logChannelData = await logChannelSchema.findOne({ Guild: interaction.guild.id });
        const logChannel = interaction.guild.channels.cache.get(logChannelData?.Channel);
        const modsettingData = await modsettingSchema.findOne({ Guild: interaction.guild.id });

        const unlockdownContainer = new ContainerBuilder()
        .setAccentColor(0x19cc10)
        .addTextDisplayComponents(new TextDisplayBuilder().setContent(`### Csatorna megnyitás: \`${textChannel.name}\` (${textChannel})`))
        .addSeparatorComponents(new SeparatorBuilder())
        .addTextDisplayComponents(new TextDisplayBuilder().setContent(`-# ${userAuthor.user.username} ● \`${moment().tz("Europe/Budapest").format("YYYY/MM/DD HH:mm:ss")}\``));

        interaction.reply({ components: [unlockdownContainer], flags: [!modsettingData || modsettingData?.length === 0 || modsettingData.Send ? "" : MessageFlags.Ephemeral, MessageFlags.IsComponentsV2] });
        if ((interaction.channel.id !== textChannel.id) && (!modsettingData || modsettingData?.length === 0 || modsettingData.Send)) textChannel.send({ components: [unlockdownContainer], flags: MessageFlags.IsComponentsV2 });

        if (logChannel && !logChannel?.permissionsFor(interaction.guild.members.me).has(PermissionFlagsBits.ViewChannel) && !logChannel?.permissionsFor(interaction.guild.members.me).has(PermissionFlagsBits.SendMessages)) return;
        logChannel?.send({ components: [unlockdownContainer], flags: MessageFlags.IsComponentsV2 });
    }
}