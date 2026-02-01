const { ApplicationCommandType, PermissionFlagsBits, MessageFlags } = require("discord.js");

module.exports = {
    name: "Play",
    type: ApplicationCommandType.Message,
    dm_permission: false,
    run: async (client, interaction) => {
        
        if(!interaction.member.voice.channel) return interaction.reply({ content: "Lépj be egy hangcsatornába!", flags: MessageFlags.Ephemeral })

        if(!interaction.member.voice.channel.permissionsFor(interaction.guild.members.me).has(PermissionFlagsBits.Connect)) return interaction.reply({ content: "Nincs jogom ehhez: `Connect` a megadott hangcsatornában!", flags: MessageFlags.Ephemeral });
        if(!interaction.member.voice.channel.permissionsFor(interaction.guild.members.me).has(PermissionFlagsBits.ViewChannel)) return interaction.reply({ content: "Nincs jogom ehhez: `View Channel` a megadott hangcsatornában!", flags: MessageFlags.Ephemeral });
        if(!interaction.member.voice.channel.permissionsFor(interaction.guild.members.me).has(PermissionFlagsBits.Speak)) return interaction.reply({ content: "Nincs jogom ehhez: `Speak` a megadott hangcsatornában!", flags: MessageFlags.Ephemeral });

        if(!interaction.guild.members.me.permissions.has(PermissionFlagsBits.Connect)) return interaction.reply({ content: "Nincs jogom ehhez: \`Connect\`!", flags: MessageFlags.Ephemeral });
        if(!interaction.guild.members.me.permissions.has(PermissionFlagsBits.ViewChannel)) return interaction.reply({ content: "Nincs jogom ehhez: \`View Channel\`!", flags: MessageFlags.Ephemeral });
        if(!interaction.guild.members.me.permissions.has(PermissionFlagsBits.Speak)) return interaction.reply({ content: "Nincs jogom ehhez: \`Speak\`!", flags: MessageFlags.Ephemeral });

        const msg = await interaction.channel.messages.fetch(interaction.targetId);
        if (!msg.content) return interaction.reply({ content: "A kijelölt üzenet nem tartalmaz zenét!", flags: MessageFlags.Ephemeral });

        await interaction.deferReply({ flags: MessageFlags.Ephemeral });
        
        try {
            await client.distube.play(interaction.member.voice.channel, msg.content, {
                textChannel: interaction.channel,
                member: interaction.member
            });
        
            await interaction.editReply("`Hozzáadva!`");
        } catch (err) {
            return interaction.reply({ content: "Hiba történt!", flags: MessageFlags.Ephemeral });
        }
    }
}