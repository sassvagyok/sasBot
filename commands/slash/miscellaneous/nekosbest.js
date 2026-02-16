import { ApplicationCommandOptionType, MessageFlags, ContainerBuilder, TextDisplayBuilder, MediaGalleryBuilder, SeparatorBuilder, ButtonBuilder, SectionBuilder } from "discord.js";
import { fetchRandom } from "nekos-best.js";
import allNeko from "../../../data/nekosbest.json" with { type: "json" };

export default {
    name: "nekosbest",
    description: "Képek és gifek a Nekos.best API-ból",
    info: "Nekos.best API segítségével kategória kiválasztása után anime gifek/képek küldése.",
    options: [
        {
            name: "kategória",
            description: "Kép kategóriája (üres: kategóriák kilistázása)",
            type: ApplicationCommandOptionType.String,
            required: false
        }
    ],
    run: async (client, interaction) => {

        const nekoType = interaction.options.getString("kategória");

        const gifNekos = allNeko.gifNekos;
        const imgNekos = allNeko.imgNekos;
        const concatNekos = gifNekos.concat(imgNekos);

        if (!nekoType || !concatNekos.includes(nekoType.toLowerCase())) 
        {
            const tagsContainer = new ContainerBuilder()
            .addTextDisplayComponents(new TextDisplayBuilder().setContent(`### Nekosbest kategóriák`))
            .addSeparatorComponents(new SeparatorBuilder())
            .addTextDisplayComponents(new TextDisplayBuilder().setContent(`- **Képek:**\n\`\`\`${imgNekos.join(", ")}\`\`\`\n- **Gifek:**\n\`\`\`${gifNekos.join(", ")}\`\`\``));

            return interaction.reply({ components: [tagsContainer], flags: MessageFlags.IsComponentsV2 });
        }

        const neko = await fetchRandom(nekoType.toLowerCase());

        const nekoGalleryComponent = new MediaGalleryBuilder()
        .addItems([
            {
                media: {
                    url: neko.results[0].url
                }
            }
        ]);

        let headerSection;
        const nekoContainer = new ContainerBuilder();

        if (neko.results[0].source_url) {
            const linkButton = new ButtonBuilder()
            .setStyle("Link")
            .setURL(neko.results[0].source_url)
            .setLabel("Megnyitás");

            headerSection = new SectionBuilder()
            .addTextDisplayComponents(new TextDisplayBuilder().setContent(`### Nekosbest: \`${nekoType.toLowerCase()}\``))
            .setButtonAccessory(linkButton);

            nekoContainer.addSectionComponents(headerSection);
        } else {
            nekoContainer.addTextDisplayComponents(new TextDisplayBuilder().setContent(`### Nekosbest: \`${nekoType.toLowerCase()}\``));
        }

        nekoContainer
        .addSeparatorComponents(new SeparatorBuilder())
        .addMediaGalleryComponents(nekoGalleryComponent)
        .addTextDisplayComponents(new TextDisplayBuilder().setContent(`- ${neko.results[0].artist_href ? `[${neko.results[0].artist_name}](${neko.results[0].artist_href})` : neko.results[0].anime_name}`));

        interaction.reply({ components: [nekoContainer], flags: MessageFlags.IsComponentsV2 });
    }
}