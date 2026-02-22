import { ApplicationCommandOptionType, MessageFlags, ContainerBuilder, TextDisplayBuilder, MediaGalleryBuilder, SeparatorBuilder, ButtonBuilder, SectionBuilder } from "discord.js";
import { fetchRandom } from "nekos-best.js";
import fetch from "node-fetch";

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

        const nekoCategory = interaction.options.getString("kategória");

        const fetchCategories = await fetch("https://nekos.best/api/v2/endpoints");
        const fetchedCategoriesJson = await fetchCategories.json();

        const gifNekos = Object.entries(fetchedCategoriesJson).filter(([name, value]) => value.format === "gif").map(([name]) => name);
        const imgNekos = Object.entries(fetchedCategoriesJson).filter(([name, value]) => value.format === "png").map(([name]) => name);

        let neko;
        try {
            neko = await fetchRandom(nekoCategory?.toLowerCase());
        } catch(error) {
           const tagsContainer = new ContainerBuilder()
            .addTextDisplayComponents(new TextDisplayBuilder().setContent(`### Nekosbest kategóriák`))
            .addSeparatorComponents(new SeparatorBuilder())
            .addTextDisplayComponents(new TextDisplayBuilder().setContent(`- **Képek:**\n\`\`\`${imgNekos.join(", ")}\`\`\`\n- **Gifek:**\n\`\`\`${gifNekos.join(", ")}\`\`\``));

            return interaction.reply({ components: [tagsContainer], flags: MessageFlags.IsComponentsV2 }); 
        }

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
            .addTextDisplayComponents(new TextDisplayBuilder().setContent(`### ${nekoCategory ? `Nekosbest: \`${nekoCategory.toLowerCase()}\`` : "Nekosbest"}`))
            .setButtonAccessory(linkButton);

            nekoContainer.addSectionComponents(headerSection);
        } else {
            nekoContainer.addTextDisplayComponents(new TextDisplayBuilder().setContent(`### ${nekoCategory ? `Nekosbest: \`${nekoCategory.toLowerCase()}\`` : "Nekosbest"}`));
        }

        nekoContainer
        .addSeparatorComponents(new SeparatorBuilder())
        .addMediaGalleryComponents(nekoGalleryComponent)
        .addTextDisplayComponents(new TextDisplayBuilder().setContent(`- ${neko.results[0].artist_href ? `[${neko.results[0].artist_name}](${neko.results[0].artist_href})` : neko.results[0].anime_name}`));

        interaction.reply({ components: [nekoContainer], flags: MessageFlags.IsComponentsV2 });
    }
}