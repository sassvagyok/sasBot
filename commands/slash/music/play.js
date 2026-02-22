import { ApplicationCommandOptionType, PermissionFlagsBits, MessageFlags } from "discord.js";

export default {
    name: "play",
    description: "Zenék indítása",
    info: "Zene nevének, linkjének vagy lejátszási lista linkjének beírása után megadott zene lejátszása, több száz oldalról. (Szükséges hangcsatornához való csatlakozás)",
    dm_permission: false,
    options: [
        {
            name: "zene",
            description: "Zene neve, linkje vagy lejátszási lista linkje",
            type: ApplicationCommandOptionType.String,
            required: true,
            maxLength: 250
        }
    ],
    run: async (client, interaction) => {

        const song = interaction.options.getString("zene");

        if (!interaction.member.voice.channel) return interaction.reply({ content: "Lépj be egy hangcsatornába!", flags: MessageFlags.Ephemeral });

        if (!interaction.member.voice.channel.permissionsFor(interaction.guild.members.me).has(PermissionFlagsBits.Connect)) return interaction.reply({ content: "Nincs jogom ehhez: `Connect` a megadott hangcsatornában!", flags: MessageFlags.Ephemeral });
        if (!interaction.member.voice.channel.permissionsFor(interaction.guild.members.me).has(PermissionFlagsBits.ViewChannel)) return interaction.reply({ content: "Nincs jogom ehhez: `View Channel` a megadott hangcsatornában!", flags: MessageFlags.Ephemeral });
        if (!interaction.member.voice.channel.permissionsFor(interaction.guild.members.me).has(PermissionFlagsBits.Speak)) return interaction.reply({ content: "Nincs jogom ehhez: `Speak` a megadott hangcsatornában!", flags: MessageFlags.Ephemeral });

        if (!interaction.guild.members.me.permissions.has(PermissionFlagsBits.Connect)) return interaction.reply({ content: "Nincs jogom ehhez: \`Connect\`!", flags: MessageFlags.Ephemeral });
        if (!interaction.guild.members.me.permissions.has(PermissionFlagsBits.ViewChannel)) return interaction.reply({ content: "Nincs jogom ehhez: \`View Channel\`!", flags: MessageFlags.Ephemeral });
        if (!interaction.guild.members.me.permissions.has(PermissionFlagsBits.Speak)) return interaction.reply({ content: "Nincs jogom ehhez: \`Speak\`!", flags: MessageFlags.Ephemeral });

        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        try {
            await client.distube.play(interaction.member.voice.channel, song, {
                voiceChannel: interaction.member.voice.channel,
                textChannel: interaction.channel,
                member: interaction.member
            });
        
            await interaction.editReply("`Hozzáadva!`");
        } catch (err) {
            return interaction.reply({ content: "Hiba történt!", flags: MessageFlags.Ephemeral });
        }
    }
}