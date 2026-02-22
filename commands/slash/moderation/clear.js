import { ApplicationCommandOptionType, PermissionFlagsBits, ChannelType, MessageFlags, ContainerBuilder, TextDisplayBuilder, SeparatorBuilder } from "discord.js";
import logChannelSchema from "../../../models/logchannelModel.js";
import modsettingSchema from "../../../models/modsettingModel.js";
import moment from "moment";
import "moment-timezone";

export default {
    name: "clear",
    description: "Üzenetek törlése",
    info: "Megadott számú üzenet törlése a jelenlegi vagy megadott csatornában (max. 100).\n`Szükséges jogosultság: Üzenetek kezelése`",
    dm_permission: false,
    permission: PermissionFlagsBits.ManageMessages,
    options: [
        {
            name: "üzenetek",
            description: "Eltávolítandó üzenetek száma",
            type: ApplicationCommandOptionType.Number,
            required: true,
            minValue: 1,
            maxValue: 100
        },
        {
            name: "csatorna",
            description: "Csatorna, ahonnan törölve legyenek az üzenetek (üres: jelenlegi csatorna)",
            type: ApplicationCommandOptionType.Channel,
            channelTypes: [ChannelType.GuildText],
            required: false
        }
    ],
    run: async (client, interaction) => {

        if (!interaction.guild.members.me.permissions.has(PermissionFlagsBits.ManageMessages)) return interaction.reply({ content: "Nincs jogom ehhez: \`Manage Messages\`!", flags: MessageFlags.Ephemeral });

        const numOfMsgs = interaction.options.getNumber("üzenetek");
        const textChannel = interaction.options.getChannel("csatorna") || interaction.channel;
        const userAuthor = interaction.member;
        const modsettingData = await modsettingSchema.findOne({ Guild: interaction.guild.id });
        const logChannelData = await logChannelSchema.findOne({ Guild: interaction.guild.id });   
        const logChannel = interaction.guild.channels.cache.get(logChannelData?.Channel);

        const clearContainer = new ContainerBuilder()
        .setAccentColor(0x22b1e5)
        .addTextDisplayComponents(new TextDisplayBuilder().setContent(`### \`${numOfMsgs}\` üzenet törölve | \`${textChannel.name}\` (${textChannel})`))
        .addSeparatorComponents(new SeparatorBuilder().setDivider())
        .addTextDisplayComponents(new TextDisplayBuilder().setContent(`-# ${userAuthor.user.username} ● \`${moment().tz("Europe/Budapest").format("YYYY/MM/DD HH:mm:ss")}\``)); 

        await textChannel.messages.fetch({ limit: numOfMsgs}).then(messages => {
            textChannel.bulkDelete(messages, true);

            interaction.reply({ components: [clearContainer], flags: [!modsettingData || modsettingData?.length === 0 || modsettingData.Send ? "" : MessageFlags.Ephemeral, MessageFlags.IsComponentsV2] });

            if (logChannel && !logChannel?.permissionsFor(interaction.guild.members.me).has(PermissionFlagsBits.ViewChannel) && !logChannel?.permissionsFor(interaction.guild.members.me).has(PermissionFlagsBits.SendMessages)) return;
            logChannel?.send({ components: [clearContainer], flags: MessageFlags.IsComponentsV2 });
        });
    }
}