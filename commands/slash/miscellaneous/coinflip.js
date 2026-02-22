import { MessageFlags, ContainerBuilder, TextDisplayBuilder, ThumbnailBuilder, SectionBuilder, AttachmentBuilder } from "discord.js";

export default {
    name: "coinflip",
    description: "Fej vagy írás",
    info: "Virtuális pénzérme feldobása, azaz fej vagy írás.",
    run: async (client, interaction) => {
            
        const sides = [
            {
                result: "Fej",
                img: "media/100ft_head.png"
            },
            {
                result: "Írás",
                img: "media/100ft_tail.png"
            }
        ];

        const randomIndex = Math.floor(Math.random() * sides.length);
        const randomSide = sides[randomIndex];
        const attachment = new AttachmentBuilder(randomSide.img, { name: "érme.png" });

        const coinflipThumbnailComponent = new ThumbnailBuilder({
            media: {
                url: "attachment://érme.png"
            }
        });

        const coinflipSection = new SectionBuilder()
        .addTextDisplayComponents(new TextDisplayBuilder().setContent(`## ${randomSide.result}`))
        .setThumbnailAccessory(coinflipThumbnailComponent);

        const coinflipContainer = new ContainerBuilder()
        .addSectionComponents(coinflipSection);

        interaction.reply({ components: [coinflipContainer], files: [attachment], flags: MessageFlags.IsComponentsV2 });
    }
}