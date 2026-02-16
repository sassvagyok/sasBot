import { MessageFlags, ContainerBuilder, TextDisplayBuilder } from "discord.js";

export default {
    name: "resume",
    description: "Lejátszás folytatása",
    info: "Megállított zene lejátszásának folytatása. (Szükséges hangcsatornához való csatlakozás)",
    dm_permission: false,
    vc_check: true,
    run: async (client, interaction) => {

        let guildQueue = client.distube.getQueue(interaction);
        if (!guildQueue || guildQueue.songs.length === 0) return interaction.reply({ content: "Jelenleg nem megy zene!", flags: MessageFlags.Ephemeral });
        if (!guildQueue.paused) return interaction.reply({ content: "A jelenlegi zene nincs megálítva!", flags: MessageFlags.Ephemeral });

        guildQueue.resume();

        const resumeContainer = new ContainerBuilder()
        .setAccentColor(0x9327de)
        .addTextDisplayComponents(new TextDisplayBuilder().setContent(`▶️ Lejátszás folytatva`));
        
        interaction.reply({ components: [resumeContainer], flags: MessageFlags.IsComponentsV2 });
    }
}