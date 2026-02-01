const { ApplicationCommandOptionType, PermissionFlagsBits, ChannelType, MessageFlags, ContainerBuilder, TextDisplayBuilder, SeparatorBuilder  } = require("discord.js");

const modsettingSchema = require("../../../models/modsettingModel.js");

const moment = require("moment");
require("moment-timezone");

module.exports = {
    name: "slowmode",
    description: "Lassított mód kezelése",
    info: "Lassított mód kezelése a jelenlegi vagy megadott csatornán.\n`Szükséges jogosultság: Csatornák kezelése`",
    dm_permission: false,
    permission: PermissionFlagsBits.ManageChannels,
    options: [
        {
            name: "másodperc",
            description: "Lassított mód mértéke (másodpercben)",
            type: ApplicationCommandOptionType.Number,
            required: true,
            minValue: 0,
            maxValue: 21600
        },
        {
            name: "csatorna",
            description: "Csatorna, ahol változzon a lassított mód (üres: jelenlegi csatorna)",
            type: ApplicationCommandOptionType.Channel,
            channelTypes: [ChannelType.GuildText],
            required: false
        }
    ],
    run: async (client, interaction) => {

        if (!interaction.guild.members.me.permissions.has(PermissionFlagsBits.ManageChannels)) return interaction.reply({ content: "Nincs jogom ehhez: \`Manage Channels\`!", flags: MessageFlags.Ephemeral });

        const textChannel = interaction.options.getChannel("csatorna") || interaction.channel;
        const duration = interaction.options.getNumber("másodperc");
        const userAuthor = interaction.member;
        const modsettingData = await modsettingSchema.findOne({ Guild: interaction.guild.id });

        if (!textChannel.permissionsFor(interaction.member).has(PermissionFlagsBits.SendMessages)) return interaction.reply({ content: "Nincs hozzáférésed ehhez a csatornához!", flags: MessageFlags.Ephemeral });

        if (!textChannel.permissionsFor(interaction.guild.members.me).has(PermissionFlagsBits.ViewChannel)) return interaction.reply({ content: "Nincs hozzáférésem a megadott csatornához!", flags: MessageFlags.Ephemeral });
            
        const previousSlow = textChannel.rateLimitPerUser;
        textChannel.setRateLimitPerUser(duration, `${userAuthor.user.username}`);

        // Container létrehozása
        const slowmodeContainer = new ContainerBuilder()
        .setAccentColor(0xffce0c)
        .addTextDisplayComponents(new TextDisplayBuilder().setContent(`### Lassított mód: \`${previousSlow} mp -> ${duration} mp\` | \`${textChannel.name}\` (${textChannel})`))
        .addSeparatorComponents(new SeparatorBuilder())
        .addTextDisplayComponents(new TextDisplayBuilder().setContent(`-# ${userAuthor.user.username} ● \`${moment().tz("Europe/Budapest").format("YYYY/MM/DD HH:mm:ss")}\``)); 

        interaction.reply({ components: [slowmodeContainer], flags: [!modsettingData || modsettingData?.length === 0 || modsettingData.Send ? "" : MessageFlags.Ephemeral, MessageFlags.IsComponentsV2] });
    }
}