import { MessageFlags, ContainerBuilder, TextDisplayBuilder } from "discord.js";
import { isVoiceChannelEmpty } from "distube";

export default {
    name: "voiceStateUpdate",
    run: async (client, oldState) => {
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
    }
};