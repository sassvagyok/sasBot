const { ApplicationCommandOptionType, ChannelType, PermissionFlagsBits, MessageFlags } = require("discord.js");

module.exports = {
    name: "echo",
    description: "Bármit mondhatsz a nevemben",
    info: "Választott szöveg elküldése sasBot által (opcionálisan kiválasztható csatorna).",
    dm_permission: false,
    options: [
        {
            name: "üzenet",
            description: "Kiírandó szöveg",
            type: ApplicationCommandOptionType.String,
            required: true,
            maxLength: 1500
        },
        {
            name: "csatorna",
            description: "Küldés helye (üres: jelenlegi csatorna)",
            type: ApplicationCommandOptionType.Channel,
            channelTypes: [ChannelType.GuildText],
            required: false
        }
    ],
    run: async (client, interaction, args) => { 
        
        const channel = interaction.options.getChannel("csatorna") || interaction.channel;
        const msg = interaction.options.getString("üzenet");

        if (channel === interaction.channel) interaction.reply({ content: msg });
        else {
            if (!channel.permissionsFor(interaction.member).has(PermissionFlagsBits.SendMessages)) return interaction.reply({ content: "Nincs hozzáférésed ehhez a csatornához!", flags: MessageFlags.Ephemeral });

            if (channel.permissionsFor(interaction.guild.members.me).has(PermissionFlagsBits.ViewChannel) && channel.permissionsFor(interaction.guild.members.me).has(PermissionFlagsBits.SendMessages)) {
                channel.send(msg);
                
                interaction.reply({ content: "Elküldve!", flags: MessageFlags.Ephemeral });
            } else interaction.reply({ content: "Nincs hozzáférésem a megadott csatornához!", flags: MessageFlags.Ephemeral });
        }
    }
}