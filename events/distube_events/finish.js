import { MessageFlags, ContainerBuilder, TextDisplayBuilder } from "discord.js";

export default {
    name: "finish",
    distube: true,
    run: async (client, queue) => {
        queue.voice.leave();

        const finishContainer = new ContainerBuilder()
        .setAccentColor(0x9327de)
        .addTextDisplayComponents(new TextDisplayBuilder().setContent("A lejátszási sor véget ért!"));

        queue.textChannel.send({ components: [finishContainer], flags: MessageFlags.IsComponentsV2 });
    }
};