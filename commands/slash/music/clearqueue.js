import { MessageFlags, ContainerBuilder, TextDisplayBuilder } from "discord.js";

export default {
    name: "clearqueue",
    description: "Lejátszási sor törlése",
    info: "Soron következő összes zene törlése a lejátszási sorból. (Szükséges hangcsatornához való csatlakozás)",
    dm_permission: false,
    run: async (client, interaction) => {
        
        let guildQueue = client.distube.getQueue(interaction);
        if (!guildQueue || guildQueue.songs.length === 0) return interaction.reply({ content: "A lejátszási sor üres!", flags: MessageFlags.Ephemeral });
        
        guildQueue.pause();
        guildQueue.remove();

        const clearqueueContainer = new ContainerBuilder()
        .setAccentColor(0x9327de)
        .addTextDisplayComponents(new TextDisplayBuilder().setContent(`🗑️ Lejátszási sorból törölt zenék: \`${guildQueue.songs.length}\` \`(${guildQueue.formattedDuration})\``));
        
        interaction.reply({ components: [clearqueueContainer], flags: MessageFlags.IsComponentsV2 });
    }
}