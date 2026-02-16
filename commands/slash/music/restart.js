import { MessageFlags, ContainerBuilder, TextDisplayBuilder } from "discord.js";

export default {
    name: "restart",
    description: "Zene újraindítása",
    info: "Jelenleg lejátszott zene újraindítása. (Szükséges hangcsatornához való csatlakozás)",
    dm_permission: false,
    vc_check: true,
    run: async (client, interaction) => {

        let guildQueue = client.distube.getQueue(interaction);
        if (!guildQueue || guildQueue.songs.length === 0) return interaction.reply({ content: "A lejátszási sor üres!", flags: MessageFlags.Ephemeral });

        await guildQueue.seek(0);

        const restartContainer = new ContainerBuilder()
        .setAccentColor(0x9327de)
        .addTextDisplayComponents(new TextDisplayBuilder().setContent("🔄️ Zene újraindítva"));
        
        interaction.reply({ components: [restartContainer], flags: MessageFlags.IsComponentsV2 });
    }
}