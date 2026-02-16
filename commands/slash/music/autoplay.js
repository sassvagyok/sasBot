import { MessageFlags, ContainerBuilder, TextDisplayBuilder } from "discord.js";

export default {
    name: "autoplay",
    description: "Automatikus lejátszás állítása",
    info: "Automatikus lejátszás kezelése a lejátszási sorban lévő zenék alapján. (Szükséges hangcsatornához való csatlakozás)",
    dm_permission: false,
    vc_check: true,
    run: async (client, interaction) => {

        let guildQueue = client.distube.getQueue(interaction);
        if (!guildQueue || guildQueue.songs.length === 0) return interaction.reply({ content: "A lejátszási sor üres!", flags: MessageFlags.Ephemeral });

        if (!guildQueue.autoplay) guildQueue.toggleAutoplay();
        else guildQueue.toggleAutoplay();
        
        const autoplayContainer = new ContainerBuilder()
        .setAccentColor(0x9327de)
        .addTextDisplayComponents(new TextDisplayBuilder().setContent(guildQueue.autoplay ? "✅ Automatikus lejátszás bekapcsolva" : "❌ Automatikus lejátszás kikapcsolva"));
        
        interaction.reply({ components: [autoplayContainer], flags: MessageFlags.IsComponentsV2 });
    }
}