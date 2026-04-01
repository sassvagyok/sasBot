import { MessageFlags, ContainerBuilder, TextDisplayBuilder, SectionBuilder, ThumbnailBuilder } from "discord.js";

export default {
    name: "addSong",
    distube: true,
    run: async (client, queue, song) => {
        if (!queue.songs[1]) return;

        const songThumbnailComponent = new ThumbnailBuilder({
            media: { url: song.thumbnail }
        });

        const thumbnailSection = new SectionBuilder()
        .addTextDisplayComponents(new TextDisplayBuilder().setContent(`**➕ Zene hozzáadva**`))
        .setThumbnailAccessory(songThumbnailComponent)
        .addTextDisplayComponents(new TextDisplayBuilder().setContent(`- **Felöltő:** \`${song.uploader.name}\`\n- **Megtekintések:** \`${Intl.NumberFormat().format(song.views)}\`\n- **Hossz:** \`${song.formattedDuration}\``));

        const songContainer = new ContainerBuilder()
        .setAccentColor(0x9327de)
        .addSectionComponents(thumbnailSection)
        .addTextDisplayComponents(new TextDisplayBuilder().setContent(`-# Hozzáadta: ${song.member.user.username}`));

        await queue.textChannel.send({ components: [songContainer], flags: MessageFlags.IsComponentsV2 });
    }
};