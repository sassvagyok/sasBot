import { ApplicationCommandOptionType, MessageFlags, ContainerBuilder, TextDisplayBuilder, ActionRowBuilder, ButtonBuilder, SeparatorBuilder } from "discord.js";
import Genius from "genius-lyrics";

export default {
    name: "lyrics",
    description: "Zenék szövegeinek kiírása",
    info: "Jelenleg lejátszott vagy megadott zene szövegének megjelenítése.",
    options: [
        {
            name: "cím",
            description: "Keresett zene címe (üres: jelenleg lejátszott zene)",
            type: ApplicationCommandOptionType.String,
            required: false,
            maxLength: 250
        }
    ],
    run: async (client, interaction) => {

        const Client = new Genius.Client(process.env.geniusToken);
        let guildQueue;
        const zene = interaction.options.getString("cím");

        if (interaction.channel.type === 1) {
            if (!zene) return interaction.reply({ content: "Adj meg egy zenecímet!", flags: MessageFlags.Ephemeral });
        } else guildQueue = client.distube.getQueue(interaction);

        await interaction.deferReply({ flags: MessageFlags.IsComponentsV2 });

        let searches;
        if (zene) searches = await Client.songs.search(zene);
        if (!zene && guildQueue) searches = await Client.songs.search(guildQueue.songs[0].name);

        if (searches.length === 0) return interaction.editReply({ content: "A megadott zene nem található!", flags: MessageFlags.Ephemeral });

        const firstSong = searches[0];
        const lyrics_full = await firstSong.lyrics();
        const lyrics = lyrics_full.substring(lyrics_full.indexOf("["));

        const urlButton = new ButtonBuilder()
        .setStyle("Link")
        .setURL(firstSong.url)
        .setEmoji("🎶")
        .setLabel("Megnyitás");

        const row = new ActionRowBuilder().addComponents(urlButton);

        const lyricsContainer = new ContainerBuilder()
        .setAccentColor(0x9327de)
        .addTextDisplayComponents(new TextDisplayBuilder().setContent(`### ${firstSong.artist.name} - ${firstSong.title}`))
        .addSeparatorComponents(new SeparatorBuilder())
        .addTextDisplayComponents(new TextDisplayBuilder().setContent(lyrics.length > 4096 ? lyrics.substring(0, 4093) + "..." : lyrics))
        .addActionRowComponents(row);

        await interaction.editReply({ components: [lyricsContainer], flags: MessageFlags.IsComponentsV2 });
    }
}