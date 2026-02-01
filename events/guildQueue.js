const { MessageFlags, ContainerBuilder, TextDisplayBuilder, SectionBuilder, ThumbnailBuilder } = require("discord.js")
const client = require("../index");

const { DisTube, isVoiceChannelEmpty } = require("distube");
const { YouTubePlugin } = require("@distube/youtube");
const { SoundCloudPlugin } = require("@distube/soundcloud");
const { SpotifyPlugin } = require("@distube/spotify");
const { YtDlpPlugin } = require("@distube/yt-dlp");

const fs = require("fs");

const distube = new DisTube(client, {
    plugins: [
        new YouTubePlugin(),
        new SpotifyPlugin(),
        new SoundCloudPlugin(),
        new YtDlpPlugin()
    ],
    emitNewSongOnly: false
});

client.distube = distube;

// Eventek
client.distube

// Hibakezelés
.on("error", async (e, queue, song) => {
    console.error(e);

    const errorContainer = new ContainerBuilder()
    .setAccentColor(0xe2162e)
    .addTextDisplayComponents(new TextDisplayBuilder().setContent("### Hiba történt!\n- Ha nem működik a YouTube lejátszás, használj másik forrást!\n- Más esetben keresd fel a [Support Szervert](https://discord.gg/s8XtzBasQF)!"));

    await queue.textChannel.send({ components: [errorContainer], flags: MessageFlags.IsComponentsV2 });
})

// Zene hozzáadása
.on("addSong", async (queue, song) => {
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
})

// Lejátszási lista hozzáadása
.on("addList", async (queue, playlist) => {
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
})

// Zene lejátszása
.on("playSong", async (queue, song) => {
    if (queue.repeatMode !== 0) return;

    const songThumbnailComponent = new ThumbnailBuilder({
        media: { url: song.thumbnail }
    });

    const thumbnailSection = new SectionBuilder()
    .addTextDisplayComponents(new TextDisplayBuilder().setContent(`**▶️ Lejátszás | #${queue.voiceChannel.name}\n### [${song.name}](${song.url})**`))
    .setThumbnailAccessory(songThumbnailComponent)
    .addTextDisplayComponents(new TextDisplayBuilder().setContent(`- **Felöltő:** \`${song.uploader.name}\`\n- **Megtekintések:** \`${Intl.NumberFormat().format(song.views)}\`\n- **Hossz:** \`${song.formattedDuration}\``));

    const songContainer = new ContainerBuilder()
    .setAccentColor(0x9327de)
    .addSectionComponents(thumbnailSection);

    if (song.member.id === client.user.id) songContainer.addTextDisplayComponents(new TextDisplayBuilder().setContent(`-# Automatikus lejátszás`));
    else songContainer.addTextDisplayComponents(new TextDisplayBuilder().setContent(`-# Hozzáadta: ${song.member.user.username}`));

    await queue.textChannel.send({ components: [songContainer], flags: MessageFlags.IsComponentsV2 });
})

// Ha nincs találat
.on("searchNoResult", (message, query) => {
    const noResultContainer = new ContainerBuilder()
    .setAccentColor(0xe2162e)
    .addTextDisplayComponents(new TextDisplayBuilder().setContent(`\`${query}\` nem található!`));

    message.channel.send({ components: [noResultContainer], flags: MessageFlags.IsComponentsV2 });
})

// Lejátszás bejezése
.on("finish", (queue) => {
    queue.voice.leave();

    const finishContainer = new ContainerBuilder()
    .setAccentColor(0x9327de)
    .addTextDisplayComponents(new TextDisplayBuilder().setContent("A lejátszási sor véget ért!"));

    queue.textChannel.send({ components: [finishContainer], flags: MessageFlags.IsComponentsV2 });
});

// Ha mindenki kilépett
client.on("voiceStateUpdate", async (oldState) => {
    if (!oldState?.channel) return;

    const queue = await client.distube.getQueue(oldState);

    if (queue && isVoiceChannelEmpty(oldState)) {
        const voice = queue.voices.get(oldState);

        voice.leave();

        const emptyVcContainer = new ContainerBuilder()
        .setAccentColor(0x9327de)
        .addTextDisplayComponents(new TextDisplayBuilder().setContent("Mindenki kilépett, lejátszás leállítva!"));

        queue.textChannel.send({ components: [emptyVcContainer], flags: MessageFlags.IsComponentsV2 });
    }
});