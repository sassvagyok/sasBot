import { MessageFlags, ContainerBuilder, TextDisplayBuilder, SectionBuilder, ThumbnailBuilder } from "discord.js";

export default {
    name: "addList",
    distube: true,
    run: async (client, queue, playlist) => {
        const playlistThumbnailComponent = new ThumbnailBuilder({
        media: { url: playlist.thumbnail }
        });

        const thumbnailSection = new SectionBuilder()
        .addTextDisplayComponents(new TextDisplayBuilder().setContent(`**➕ Lejátszási lista hozzáadva**\n### [${playlist.name}](${playlist.url})`))
        .setThumbnailAccessory(playlistThumbnailComponent)
        .addTextDisplayComponents(new TextDisplayBuilder().setContent(`- **Zenék:** \`${playlist.songs.length}\`\n- **Hossz:** \`${playlist.formattedDuration}\``));

        const playlistContainer = new ContainerBuilder()
        .setAccentColor(0x9327de)
        .addSectionComponents(thumbnailSection)
        .addTextDisplayComponents(new TextDisplayBuilder().setContent(`-# Hozzáadta: ${playlist.member.user.username}`));

        await queue.textChannel.send({ components: [playlistContainer], flags: MessageFlags.IsComponentsV2 });
    }
};