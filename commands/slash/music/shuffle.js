import { MessageFlags, ContainerBuilder, TextDisplayBuilder } from "discord.js";

export default {
    name: "shuffle",
    description: "Lejátszási sor megkeverése",
    info: "A lejátszási sorban lévő zenék lejátszási sorrendjének megkeverése. (Szükséges hangcsatornához való csatlakozás)",
    dm_permission: false,
    vc_check: true,
    run: async (client, interaction, args) => {

        let guildQueue = client.distube.getQueue(interaction);
        if (!guildQueue || guildQueue.songs.length === 0) return interaction.reply({ content: "A lejátszási sor üres!", flags: MessageFlags.Ephemeral });
        if (guildQueue.songs.length < 3) return interaction.reply({ content: `Nincs elég zene a megkeveréshez! (\`${guildQueue.songs.length}\`)`, flags: MessageFlags.Ephemeral });

        guildQueue.shuffle();

        const shuffleContainer = new ContainerBuilder()
        .setAccentColor(0x9327de)
        .addTextDisplayComponents(new TextDisplayBuilder().setContent(`🔀 \`${guildQueue.songs.length - 1}\` zene megkeverve`));
        
        interaction.reply({ components: [shuffleContainer], flags: MessageFlags.IsComponentsV2 });
    }
}