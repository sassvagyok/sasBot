import { ApplicationCommandOptionType, PermissionFlagsBits, MessageFlags } from "discord.js";

export default {
    name: "play",
    description: "Zenék indítása",
    info: "Soundcloud zene vagy lejátszási lista linkjének beírása után annak lejátszása. (Szükséges hangcsatornához való csatlakozás)",
    dm_permission: false,
    options: [
        {
            name: "link",
            description: "Soundcloud zene vagy lejátszási lista linkje",
            type: ApplicationCommandOptionType.String,
            required: true,
            maxLength: 250
        }
    ],
    run: async (client, interaction) => {

        const song = interaction.options.getString("link");

        if (!interaction.member.voice.channel) return interaction.reply({ content: "Lépj be egy hangcsatornába!", flags: MessageFlags.Ephemeral });

        if (!interaction.member.voice.channel.permissionsFor(interaction.guild.members.me).has(PermissionFlagsBits.Connect)) return interaction.reply({ content: "Nincs jogom ehhez: `Connect` a megadott hangcsatornában!", flags: MessageFlags.Ephemeral });
        if (!interaction.member.voice.channel.permissionsFor(interaction.guild.members.me).has(PermissionFlagsBits.ViewChannel)) return interaction.reply({ content: "Nincs jogom ehhez: `View Channel` a megadott hangcsatornában!", flags: MessageFlags.Ephemeral });
        if (!interaction.member.voice.channel.permissionsFor(interaction.guild.members.me).has(PermissionFlagsBits.Speak)) return interaction.reply({ content: "Nincs jogom ehhez: `Speak` a megadott hangcsatornában!", flags: MessageFlags.Ephemeral });

        if (!interaction.guild.members.me.permissions.has(PermissionFlagsBits.Connect)) return interaction.reply({ content: "Nincs jogom ehhez: \`Connect\`!", flags: MessageFlags.Ephemeral });
        if (!interaction.guild.members.me.permissions.has(PermissionFlagsBits.ViewChannel)) return interaction.reply({ content: "Nincs jogom ehhez: \`View Channel\`!", flags: MessageFlags.Ephemeral });
        if (!interaction.guild.members.me.permissions.has(PermissionFlagsBits.Speak)) return interaction.reply({ content: "Nincs jogom ehhez: \`Speak\`!", flags: MessageFlags.Ephemeral });

        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        function isValidUrl(string) {
            try {
                new URL(string);
                return true;
            } catch (err) {
                return false;
            }
        }

        if (!isValidUrl(song)) {
            return interaction.editReply("A megadott zene nem érvényes link!");
        }

        try {
            await client.distube.play(interaction.member.voice.channel, song, {
                voiceChannel: interaction.member.voice.channel,
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