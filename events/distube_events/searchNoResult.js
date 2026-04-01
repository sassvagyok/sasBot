import { MessageFlags, ContainerBuilder, TextDisplayBuilder } from "discord.js";

export default {
    name: "seachNoResult",
    distube: true,
    run: async (client, message, query) => {
        const noResultContainer = new ContainerBuilder()
        .setAccentColor(0xe2162e)
        .addTextDisplayComponents(new TextDisplayBuilder().setContent(`\`${query}\` nem található!`));

        message.channel.send({ components: [noResultContainer], flags: MessageFlags.IsComponentsV2 });
    }
};