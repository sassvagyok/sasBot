import { MessageFlags, ContainerBuilder, TextDisplayBuilder, ThumbnailBuilder, SectionBuilder } from "discord.js";
import fetch from "node-fetch";

export default {
    name: "catfact",
    description: "Random macska érdekesség",
    info: "Egy random érdekesség a macskákról.",
    run: async (client, interaction) => {

        const fetchFact = await fetch("https://catfact.ninja/fact");
        const fetchedFactJson = await fetchFact.json();

        const fetchImg = await fetch("https://api.thecatapi.com/v1/images/search");
        const fetchedImgJson = await fetchImg.json();

        const catfactThumbnailComponent = new ThumbnailBuilder({
            media: {
                url: fetchedImgJson[0].url
            }
        });

        const catfactSection = new SectionBuilder()
        .addTextDisplayComponents(new TextDisplayBuilder().setContent(fetchedFactJson.fact))
        .setThumbnailAccessory(catfactThumbnailComponent);

        const catfactContainer = new ContainerBuilder()
        .addSectionComponents(catfactSection);

        interaction.reply({ components: [catfactContainer], flags: MessageFlags.IsComponentsV2 });
    }
}

