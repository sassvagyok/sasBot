import { MessageFlags, ContainerBuilder, TextDisplayBuilder } from "discord.js";

export default {
    name: "error",
    distube: true,
    run: async (client, e, queue, song) => {
        console.error(e);

        const errorContainer = new ContainerBuilder()
        .setAccentColor(0xe2162e)
        .addTextDisplayComponents(new TextDisplayBuilder().setContent("### Hiba történt!\n- Ha nem működik a YouTube lejátszás, használj másik forrást!\n- Más esetben keresd fel a [Support Szervert](https://discord.gg/s8XtzBasQF)!"));

        await queue.textChannel.send({ components: [errorContainer], flags: MessageFlags.IsComponentsV2 });
    }
};