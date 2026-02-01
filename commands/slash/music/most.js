const { MessageFlags, SectionBuilder, ThumbnailBuilder, ContainerBuilder, TextDisplayBuilder } = require("discord.js");

module.exports = {
    name: "most",
    description: "Információk a jelenlegi zenéről",
    info: "Különböző információk a jelenleg lejátszott zenéről.",
    dm_permission: false,
    run: async (client, interaction) => {

        let guildQueue = client.distube.getQueue(interaction);
        if (!guildQueue || guildQueue.songs.length === 0) return interaction.reply({ content: "A lejátszási sor üres!", flags: MessageFlags.Ephemeral });

        const song = guildQueue.songs[0];

        const songThumbnailComponent = new ThumbnailBuilder({
            media: { url: song.thumbnail }
        });

        const thumbnailSection = new SectionBuilder()
        .addTextDisplayComponents(new TextDisplayBuilder().setContent(`**▶️ Jelenleg lejátszott | #${guildQueue.voiceChannel.name}\n### [${song.name}](${song.url})**`))
        .setThumbnailAccessory(songThumbnailComponent)
        .addTextDisplayComponents(new TextDisplayBuilder().setContent(`- **Felöltő:** \`${song.uploader.name}\`\n- **Megtekintések:** \`${Intl.NumberFormat().format(song.views)}\`\n- **Hossz:** \`${song.formattedDuration}\``));
    
        const songContainer = new ContainerBuilder()
        .setAccentColor(0x9327de)
        .addSectionComponents(thumbnailSection);
    
        if (song.member.id === client.user.id) songContainer.addTextDisplayComponents(new TextDisplayBuilder().setContent(`-# Automatikus lejátszás`));
        else songContainer.addTextDisplayComponents(new TextDisplayBuilder().setContent(`-# Hozzáadta: ${song.member.user.username}`));
    
        await interaction.reply({ components: [songContainer], flags: MessageFlags.IsComponentsV2 });
    }
}