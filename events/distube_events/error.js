import { MessageFlags, ContainerBuilder, TextDisplayBuilder } from "discord.js";

export default {
    name: "error",
    distube: true,
    run: async (client, e, queue, song) => {
        console.error(e);
        queue.voice.leave();

        const errorContainer = new ContainerBuilder()
        .setAccentColor(0xe2162e)
        .addTextDisplayComponents(new TextDisplayBuilder().setContent("### Hiba történt!\n- Csak Soundcloud zene lejátszás elérhető!"));

        await queue.textChannel.send({ components: [errorContainer], flags: MessageFlags.IsComponentsV2 });
    }
};