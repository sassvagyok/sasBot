import { MessageFlags, ContainerBuilder, TextDisplayBuilder } from "discord.js";

export default {
    name: "pause",
    description: "Lejátszás megállítása",
    info: "Jelenleg lejátszott zene megállítása a lejátszási sor törlése nélkül. (Szükséges hangcsatornához való csatlakozás)",
    dm_permission: false,
    vc_check: true,
    run: async (client, interaction) => {

        let guildQueue = client.distube.getQueue(interaction);
        if (!guildQueue || guildQueue.songs.length === 0) return interaction.reply({ content: "A lejátszási sor üres!", flags: MessageFlags.Ephemeral });
        if (guildQueue.paused) return interaction.reply({ content: "A jelenlegi zene már meg van állítva!", flags: MessageFlags.Ephemeral });
        
        guildQueue.pause();

        const pauseContainer = new ContainerBuilder()
        .setAccentColor(0x9327de)
        .addTextDisplayComponents(new TextDisplayBuilder().setContent(`⏸️ Lejátszás megállítva`));
        
        interaction.reply({ components: [pauseContainer], flags: MessageFlags.IsComponentsV2 });
    }
}