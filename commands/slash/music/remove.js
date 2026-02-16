import { ApplicationCommandOptionType, MessageFlags, SectionBuilder, ThumbnailBuilder, ContainerBuilder, TextDisplayBuilder } from "discord.js";

export default {
    name: "remove",
    description: "Törlés a lejátszási sorból",
    info: "Zene sorszámának beírása után annak törlése a lejátszási sorból. (Szükséges hangcsatornához való csatlakozás)",
    dm_permission: false,
    vc_check: true,
    options: [
        {
            name: "zene",
            description: "Zene sorszáma a lejátszási sorban",
            type: ApplicationCommandOptionType.Number,
            required: true,
            minValue: 1
        }
    ],
    run: async (client, interaction, args) => {

        const zene = interaction.options.getNumber("zene");
        
        let guildQueue = client.distube.getQueue(interaction);
        if (!guildQueue || guildQueue.songs.length === 0) return interaction.reply({ content: "A lejátszási sor üres!", flags: MessageFlags.Ephemeral });

        if (zene > guildQueue.songs.length) return interaction.reply({ content: `A lejátszási sorban lévő zenék száma: \`${guildQueue.songs.length - 1}\``, flags: MessageFlags.Ephemeral });

        const song = guildQueue.songs[zene];
        
        guildQueue.songs.splice(zene, 1);

        const songThumbnailComponent = new ThumbnailBuilder({
            media: { url: song.thumbnail }
        });

        const thumbnailSection = new SectionBuilder()
        .addTextDisplayComponents(new TextDisplayBuilder().setContent(`**🗑️ Zene törölve\n### [${song.name}](${song.url})**`))
        .setThumbnailAccessory(songThumbnailComponent)
        .addTextDisplayComponents(new TextDisplayBuilder().setContent(`- **Felöltő:** \`${song.uploader.name}\`\n- **Megtekintések:** \`${Intl.NumberFormat().format(song.views)}\`\n- **Hossz:** \`${song.formattedDuration}\``));
    
        const songContainer = new ContainerBuilder()
        .setAccentColor(0x9327de)
        .addSectionComponents(thumbnailSection)
        songContainer.addTextDisplayComponents(new TextDisplayBuilder().setContent(`-# Hozzáadta: ${song.member.user.username}`));
    
        await interaction.reply({ components: [songContainer], flags: MessageFlags.IsComponentsV2 });
    }
}