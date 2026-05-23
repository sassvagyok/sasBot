import { ApplicationCommandType, PermissionFlagsBits, MessageFlags } from "discord.js";

export default {
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

        function isValidUrl(string) {
            try {
                new URL(string);
                return true;
            } catch (err) {
                return false;
            }
        }

        if (!isValidUrl(msg.content)) {
            return interaction.editReply("A megadott zene nem érvényes link!");
        }
        
        try {
            await client.distube.play(interaction.member.voice.channel, msg.content, {
                textChannel: interaction.channel,
                member: interaction.member
            });
        
            await interaction.editReply("`Hozzáadva!`");
        } catch (err) {
            const queue = client.distube.getQueue(interaction.guild);
            if (queue.songs.length === 0) {
                client.distube.voices.leave(interaction.guild);
            }

            if (err.errorCode === "NOT_SUPPORTED_URL") {
                return interaction.editReply("A megadott link nem játszható le!");
            }
            
            return interaction.editReply({ content: "Hiba történt!", flags: MessageFlags.Ephemeral });
        }
    }
}